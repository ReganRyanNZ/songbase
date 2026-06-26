class SongAnalytic < ApplicationRecord
  # One row per day. `song_counts` is a JSONB hash: { "song_id" => count, ... }.
  # Old daily rows are periodically consolidated into monthly aggregates by rollup!.

  # A single recording request can contribute at most this many views per song,
  # so an unauthenticated caller can't inflate counts in one shot. Totals still
  # accumulate accurately across requests and days.
  MAX_DELTA_PER_REQUEST = 1000

  # Record a batch of { song_id => delta } view counts into today's row.
  # Non-positive / non-numeric deltas are ignored; blank input is a no-op.
  def self.record!(counts)
    return if counts.blank?

    additions = {}
    counts.each do |song_id, delta|
      next unless delta.is_a?(Numeric) && delta > 0
      additions[song_id.to_s] = [delta.to_i, MAX_DELTA_PER_REQUEST].min
    end
    return if additions.empty?

    row = find_or_initialize_by(date: Date.today)
    current = row.song_counts || {}
    additions.each do |key, delta| current[key] = (current[key] || 0) + delta end
    row.song_counts = current
    row.save!
  end

  # Record a single song view. Wrapped so a page load can never raise.
  def self.track_song_view(song_id)
    record!({ song_id => 1 })
  rescue => e
    Rails.logger.warn "SongAnalytic#track_song_view failed: #{e.message}"
  end

  # Top songs by total views across all rows, most-viewed first.
  # Deleted songs are excluded (Song's default_scope filters deleted_at).
  def self.summary(limit: 100)
    totals = Hash.new(0)
    find_each do |row|
      (row.song_counts || {}).each do |song_id, count| totals[song_id.to_i] += count.to_i end
    end
    songs_by_id = Song.where(id: totals.keys).index_by(&:id)
    totals.sort_by { |_, total| -total }.first(limit).map do |song_id, total|
      song = songs_by_id[song_id]
      next unless song
      { id: song.id, title: song.title, lang: song.lang, total_count: total }
    end.compact
  end

  # Consolidate daily rows older than `keep_days` into one monthly aggregate
  # per month (dated the 1st), deleting the daily rows. Idempotent: a re-run
  # just re-merges the existing monthly row and destroys nothing.
  def self.rollup!(keep_days: 7)
    cutoff = keep_days.days.ago.to_date
    old_rows = where("date < ?", cutoff).order(:date).to_a
    return 0 if old_rows.empty?

    grouped = old_rows.group_by { |row| row.date.beginning_of_month }
    grouped.each do |month_start, rows|
      merged = {}
      rows.each { |row| merge_counts(merged, row.song_counts || {}) }

      monthly = find_or_initialize_by(date: month_start)
      monthly.song_counts = merged
      monthly.save!
      rows.each { |row| row.destroy unless row.id == monthly.id }
    end
    grouped.size
  end

  def self.cleanup_old(days = 90)
    where('date < ?', days.days.ago).delete_all
  end

  def self.merge_counts(target, source)
    source.each do |song_id, count|
      next unless count.is_a?(Numeric) && count > 0
      key = song_id.to_s
      target[key] = (target[key] || 0) + count.to_i
    end
    target
  end
  private_class_method :merge_counts
end
