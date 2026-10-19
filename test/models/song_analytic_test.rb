require 'test_helper'

# SongAnalytic stores one row per day with a jsonb `song_counts` hash
# ({ "song_id" => count }). These tests cover the model API (record!,
# track_song_view, summary, rollup!, cleanup_old); the HTTP layer that
# delegates to it is covered by analytics_controller_test.rb.
class SongAnalyticTest < ActiveSupport::TestCase
  # --- record! ---

  test 'record! creates a daily row storing the song counts' do
    song1 = FactoryBot.create(:song)
    song2 = FactoryBot.create(:song, title: 'Another song')

    SongAnalytic.record!({ song1.id => 2, song2.id => 1 })

    row = SongAnalytic.find_by(date: Date.today)
    assert row
    assert_equal 2, row.song_counts[song1.id.to_s]
    assert_equal 1, row.song_counts[song2.id.to_s]
  end

  test 'record! accumulates counts across calls on the same day' do
    song = FactoryBot.create(:song)

    SongAnalytic.record!({ song.id => 3 })
    SongAnalytic.record!({ song.id => 2 })

    assert_equal 1, SongAnalytic.count
    assert_equal 5, SongAnalytic.find_by(date: Date.today).song_counts[song.id.to_s]
  end

  test 'record! ignores zero or negative deltas' do
    song = FactoryBot.create(:song)
    SongAnalytic.record!({ song.id => 0, (song.id + 1) => -5 })

    assert_equal 0, SongAnalytic.count
  end

  test 'record! is a no-op on blank input' do
    assert_nothing_raised { SongAnalytic.record!({}) }
    assert_nothing_raised { SongAnalytic.record!(nil) }
    assert_equal 0, SongAnalytic.count
  end

  test 'record! caps a single request delta per song, not the running total' do
    song = FactoryBot.create(:song)

    SongAnalytic.record!({ song.id => 9999 })
    assert_equal SongAnalytic::MAX_DELTA_PER_REQUEST, SongAnalytic.find_by(date: Date.today).song_counts[song.id.to_s]

    # Totals keep accumulating across requests.
    SongAnalytic.record!({ song.id => 9999 })
    assert_equal SongAnalytic::MAX_DELTA_PER_REQUEST * 2, SongAnalytic.find_by(date: Date.today).song_counts[song.id.to_s]
  end

  # --- track_song_view ---

  test 'track_song_view records a single view and accumulates' do
    song = FactoryBot.create(:song)
    SongAnalytic.track_song_view(song.id)
    SongAnalytic.track_song_view(song.id)

    assert_equal 2, SongAnalytic.find_by(date: Date.today).song_counts[song.id.to_s]
  end

  # --- summary ---

  test 'summary returns songs sorted by total count, excluding deleted songs' do
    song1 = FactoryBot.create(:song)
    song2 = FactoryBot.create(:song, title: 'Another song')
    deleted = FactoryBot.create(:song, deleted_at: Time.current)

    SongAnalytic.create!(date: Date.today, song_counts: { song1.id.to_s => 5 })
    SongAnalytic.create!(date: Date.today - 1, song_counts: { song1.id.to_s => 3, song2.id.to_s => 15 })
    SongAnalytic.create!(date: Date.today - 2, song_counts: { deleted.id.to_s => 100 })

    result = SongAnalytic.summary
    assert_equal 2, result.length
    assert_equal song2.id, result.first[:id]
    assert_equal 15, result.first[:total_count]
    assert_equal 8, result.second[:total_count]
    assert result.first.key?(:title)
    assert result.first.key?(:lang)
  end

  # --- rollup! ---

  test 'rollup! consolidates old daily rows into a monthly aggregate on the 1st' do
    song = FactoryBot.create(:song)
    old_date = 10.days.ago.to_date
    month_start = old_date.beginning_of_month

    SongAnalytic.create!(date: old_date, song_counts: { song.id.to_s => 4 })
    SongAnalytic.create!(date: old_date - 1, song_counts: { song.id.to_s => 3 })

    SongAnalytic.rollup!

    monthly = SongAnalytic.find_by(date: month_start)
    assert monthly, "expected a monthly aggregate on #{month_start}"
    assert_equal 7, monthly.song_counts[song.id.to_s]
    assert_nil SongAnalytic.find_by(date: old_date)
    assert_nil SongAnalytic.find_by(date: old_date - 1)
  end

  test 'rollup! leaves rows from the last 7 days untouched' do
    song = FactoryBot.create(:song)
    SongAnalytic.create!(date: Date.today, song_counts: { song.id.to_s => 5 })

    SongAnalytic.rollup!

    assert_equal 5, SongAnalytic.find_by(date: Date.today).song_counts[song.id.to_s]
  end

  test 'rollup! is idempotent' do
    song = FactoryBot.create(:song)
    SongAnalytic.create!(date: 14.days.ago.to_date, song_counts: { song.id.to_s => 4 })
    SongAnalytic.create!(date: 10.days.ago.to_date, song_counts: { song.id.to_s => 3 })

    SongAnalytic.rollup!
    rows = SongAnalytic.where('date < ?', 7.days.ago)
    total_after_first = rows.sum { |row| row.song_counts.values.sum }

    SongAnalytic.rollup!
    rows = SongAnalytic.where('date < ?', 7.days.ago)
    total_after_second = rows.sum { |row| row.song_counts.values.sum }

    assert_equal total_after_first, total_after_second
    assert_equal 1, SongAnalytic.where('date < ?', 7.days.ago).count
  end

  test 'rollup! merges an existing 1st-of-month row in place' do
    song = FactoryBot.create(:song)
    month_start = Date.new(2026, 2, 1)

    SongAnalytic.create!(date: month_start, song_counts: { song.id.to_s => 5 })
    SongAnalytic.create!(date: month_start + 4.days, song_counts: { song.id.to_s => 3 })

    SongAnalytic.rollup!

    monthly = SongAnalytic.find_by(date: month_start)
    assert_equal 8, monthly.song_counts[song.id.to_s]
    assert_nil SongAnalytic.find_by(date: month_start + 4.days)
  end

  # --- cleanup_old ---

  test 'cleanup_old removes rows older than the threshold but keeps recent ones' do
    old = SongAnalytic.create!(date: 100.days.ago.to_date, song_counts: { '1' => 5 })
    recent = SongAnalytic.create!(date: Date.today, song_counts: { '1' => 2 })

    deleted_count = SongAnalytic.cleanup_old(90)

    assert_equal 1, deleted_count
    assert_includes SongAnalytic.all, recent
    refute_includes SongAnalytic.all, old
  end
end
