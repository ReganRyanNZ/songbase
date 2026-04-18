class SongAnalytic < ApplicationRecord
  # One row per day, song_counts is a JSONB hash: { "song_id" => count, ... }

  def self.track_song_view(song_id)
    today = Date.today
    record = find_or_initialize_by(date: today)
    counts = record.song_counts || {}
    counts[song_id.to_s] = (counts[song_id.to_s] || 0) + 1
    record.song_counts = counts
    record.save!
  rescue => e
    Rails.logger.warn "SongAnalytic#track_song_view failed: #{e.message}"
  end

  def self.cleanup_old(days = 90)
    where('date < ?', days.days.ago).delete_all
  end
end
