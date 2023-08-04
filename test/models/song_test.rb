require 'test_helper'

class SongTest < ActiveSupport::TestCase

  test ".merge! keeps indicies of old song and destroys old song" do
    book = FactoryBot.create(:book)
    song1 = FactoryBot.create(:song, :hymn_ref_in_comments)
    songbook = FactoryBot.create(:song_book, song: song1, book: book)
    song2 = FactoryBot.create(:song, :no_chords)
    song2.merge!(song1)
    assert song2.reload.books.include?(book)
    assert song1.deleted_at?
    refute song2.deleted_at?
    assert_equal song1.lyrics[15..-1], song2.lyrics
  end

  test "#duplicate_titles returns duplicate songs" do
    title ="From the time I spoke Your Name"
    song1 = FactoryBot.create(:song, title: title)
    song2 = FactoryBot.create(:song, title: title)
    assert_equal [song1, song2], Song.duplicate_titles
  end

  test "#recently_changed returns recently changed songs" do
    song1 = FactoryBot.create(:song)
    song2 = FactoryBot.create(:song, updated_at: 2.years.ago)
    assert_equal [song1], Song.recently_changed
  end

  test '.destroy_with_audit adds audit and excludes from default scope' do
    song1 = FactoryBot.create(:song)
    time_before_creation = Time.now

    song2 = FactoryBot.create(:song)

    time_before_destruction = Time.now

    song2.destroy_with_audit

    assert song2.deleted_at?
    assert song2.deleted_by?

    refute_includes Song.all.map(&:id), song2.id
    assert_includes Song.deleted_after(time_before_destruction).map(&:id), song2.id
    refute_includes Song.deleted_after(time_before_creation).map(&:id), song2.id
  end
end