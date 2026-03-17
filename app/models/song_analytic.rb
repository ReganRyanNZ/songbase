class SongAnalytic < ApplicationRecord
  validates :song_id, presence: true
  validates :counted_on, presence: true
  validates :count, numericality: { greater_than: 0 }

  # Accepts a hash of { song_id => play_count } and bulk-upserts it as today's records.
  # Multiple submissions on the same day are accumulated (ON CONFLICT DO UPDATE).
  def self.record!(song_counts)
    return if song_counts.blank?
    return if song_counts.size > 5000 # guard against absurdly large payloads

    today = Date.today
    rows = song_counts.map { |song_id, count| { song_id: song_id.to_i, counted_on: today, count: [count.to_i, 1000].min } }
                      .select { |row| row[:song_id] > 0 && row[:count] > 0 }
    return if rows.empty?

    # Upsert: if a row for (song_id, counted_on) already exists, add the new count to it
    upsert_all(
      rows,
      unique_by: [:song_id, :counted_on],
      on_duplicate: Arel.sql("count = song_analytics.count + EXCLUDED.count")
    )
  end

  # Returns top songs by total play count, joined with song titles.
  # Returns an array of { id:, title:, lang:, total_count: } hashes.
  def self.summary(limit: 100)
    joins("JOIN songs ON songs.id = song_analytics.song_id AND songs.deleted_at IS NULL")
      .group("song_analytics.song_id, songs.id, songs.title, songs.lang")
      .order("total_count DESC")
      .limit(limit)
      .pluck("songs.id, songs.title, songs.lang, SUM(song_analytics.count) AS total_count")
      .map { |id, title, lang, count| { id: id, title: title, lang: lang, total_count: count } }
  end

  # Rolls up daily records older than 7 days into monthly aggregates.
  # Monthly aggregate rows use the first day of the month as counted_on.
  # After rolling up, the original daily rows are deleted.
  def self.rollup!
    cutoff = 7.days.ago.to_date

    old_rows = where("counted_on < ?", cutoff)
    return unless old_rows.any?

    # Group by (song_id, first-of-month) and sum counts
    monthly_totals = old_rows
      .group(:song_id)
      .group("date_trunc('month', counted_on)::date")
      .sum(:count)
    # monthly_totals is { [song_id, month_start] => total_count }

    # Delete old rows FIRST to avoid double-counting when upserting monthly aggregates.
    # If we upserted before deleting, any pre-existing row on the 1st of the month
    # would cause count = old_count + total (instead of just total), and re-running
    # rollup! would keep accumulating.
    old_rows.delete_all

    monthly_totals.each do |(song_id, month_start), total|
      upsert(
        { song_id: song_id, counted_on: month_start, count: total },
        unique_by: [:song_id, :counted_on],
        on_duplicate: Arel.sql("count = song_analytics.count + EXCLUDED.count")
      )
    end
  end
end
