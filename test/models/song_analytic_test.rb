require 'test_helper'

class SongAnalyticTest < ActiveSupport::TestCase
  test 'record! creates a daily row for each song' do
    song1 = FactoryBot.create(:song)
    song2 = FactoryBot.create(:song, title: "Another song")

    SongAnalytic.record!({ song1.id => 2, song2.id => 1 })

    assert_equal 2, SongAnalytic.count
    assert_equal 2, SongAnalytic.find_by(song_id: song1.id, counted_on: Date.today).count
    assert_equal 1, SongAnalytic.find_by(song_id: song2.id, counted_on: Date.today).count
  end

  test 'record! accumulates counts when called multiple times on the same day' do
    song = FactoryBot.create(:song)

    SongAnalytic.record!({ song.id => 3 })
    SongAnalytic.record!({ song.id => 2 })

    assert_equal 1, SongAnalytic.count
    assert_equal 5, SongAnalytic.find_by(song_id: song.id, counted_on: Date.today).count
  end

  test 'record! ignores zero or negative counts' do
    song = FactoryBot.create(:song)
    SongAnalytic.record!({ song.id => 0 })
    assert_equal 0, SongAnalytic.count
  end

  test 'record! does nothing with blank input' do
    assert_nothing_raised { SongAnalytic.record!({}) }
    assert_nothing_raised { SongAnalytic.record!(nil) }
    assert_equal 0, SongAnalytic.count
  end

  test 'rollup! consolidates old daily rows into monthly aggregates' do
    song = FactoryBot.create(:song)
    old_date = 10.days.ago.to_date
    month_start = old_date.beginning_of_month

    # Two daily rows from the same month, both older than 7 days
    SongAnalytic.create!(song_id: song.id, counted_on: old_date, count: 4)
    SongAnalytic.create!(song_id: song.id, counted_on: old_date - 1.day, count: 3)

    SongAnalytic.rollup!

    # Should have one monthly aggregate row
    monthly = SongAnalytic.find_by(song_id: song.id, counted_on: month_start)
    assert monthly, "Expected a monthly aggregate row on #{month_start}"
    assert_equal 7, monthly.count
    # Original non-first-of-month rows should be gone
    assert_nil SongAnalytic.find_by(song_id: song.id, counted_on: old_date)
    assert_nil SongAnalytic.find_by(song_id: song.id, counted_on: old_date - 1.day)
  end

  test 'rollup! does not affect rows from the last 7 days' do
    song = FactoryBot.create(:song)
    SongAnalytic.create!(song_id: song.id, counted_on: Date.today, count: 5)

    SongAnalytic.rollup!

    assert_equal 5, SongAnalytic.find_by(song_id: song.id, counted_on: Date.today).count
  end

  test 'rollup! is idempotent - calling twice gives the same total count' do
    song = FactoryBot.create(:song)
    SongAnalytic.create!(song_id: song.id, counted_on: 14.days.ago.to_date, count: 4)
    SongAnalytic.create!(song_id: song.id, counted_on: 10.days.ago.to_date, count: 3)

    SongAnalytic.rollup!
    count_after_first = SongAnalytic.where(song_id: song.id).sum(:count)

    SongAnalytic.rollup!
    count_after_second = SongAnalytic.where(song_id: song.id).sum(:count)

    assert_equal count_after_first, count_after_second
  end

  test 'rollup! handles an existing daily row on the 1st of the month' do
    song = FactoryBot.create(:song)
    month_start = Date.new(2026, 2, 1) # well past 7 days ago

    # One row on the 1st and one row mid-month, both old enough to be rolled up
    SongAnalytic.create!(song_id: song.id, counted_on: month_start, count: 5)
    SongAnalytic.create!(song_id: song.id, counted_on: month_start + 4.days, count: 3)

    SongAnalytic.rollup!

    monthly = SongAnalytic.find_by(song_id: song.id, counted_on: month_start)
    assert monthly, "Expected a monthly aggregate row on #{month_start}"
    assert_equal 8, monthly.count
    assert_nil SongAnalytic.find_by(song_id: song.id, counted_on: month_start + 4.days)
  end

  test 'summary returns songs sorted by total play count across multiple days' do
    song1 = FactoryBot.create(:song)
    song2 = FactoryBot.create(:song, title: 'Another song')

    SongAnalytic.create!(song_id: song1.id, counted_on: Date.today, count: 5)
    SongAnalytic.create!(song_id: song1.id, counted_on: Date.today - 1.day, count: 3)
    SongAnalytic.create!(song_id: song2.id, counted_on: Date.today, count: 15)

    result = SongAnalytic.summary
    assert_equal 2, result.length
    assert_equal song2.id, result.first[:id]
    assert_equal 15, result.first[:total_count]
    assert_equal 8, result.second[:total_count]
    assert result.first.key?(:title)
    assert result.first.key?(:lang)
  end

  test 'summary excludes deleted songs' do
    song = FactoryBot.create(:song, deleted_at: Time.current)
    SongAnalytic.create!(song_id: song.id, counted_on: Date.today, count: 10)

    assert_equal 0, SongAnalytic.summary.length
  end

  test 'record! caps count per song at 1000' do
    song = FactoryBot.create(:song)
    SongAnalytic.record!({ song.id => 9999 })
    assert_equal 1000, SongAnalytic.find_by(song_id: song.id).count
  end
end
