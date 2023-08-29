require 'test_helper'

class SongTest < ActiveSupport::TestCase

  test ".merge! keeps indicies of old song and destroys old song" do
    # Updates book index:
    old_song = FactoryBot.create(:song, :hymn_ref_in_comments)
    book = FactoryBot.create(:book, songs: {old_song.id => '7'})
    new_song = FactoryBot.create(:song)
    assert_equal('7', book.songs[old_song.id.to_s])
    assert_nil(book.songs[new_song.id.to_s])

    new_song.merge!(old_song)

    assert_nil(book.reload.songs[old_song.id.to_s])
    assert_equal('7', book.songs[new_song.id.to_s])
    assert(old_song.deleted_at)


    # Prefer lyrics that contain chords:
    song1 = FactoryBot.create(:song)
    song2 = FactoryBot.create(:song, :no_chords)
    song2.merge!(song1)
    assert song1.deleted_at?
    refute song2.deleted_at?
    assert_equal song1.lyrics, song2.lyrics
  end

  test "#duplicate_titles returns duplicate songs" do
    title ="From the time I spoke Your Name"
    song1 = FactoryBot.create(:song, title: title)
    song2 = FactoryBot.create(:song, title: title)
    song3 = FactoryBot.create(:song, title: title[0..-4])
    assert_equal [song1, song2, song3], Song.duplicate_titles
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

  test 'languages gets a distinct list of languages, sorted but with english first' do
    FactoryBot.create(:song, lang: 'english')
    FactoryBot.create(:song, lang: 'Afrikaans')
    FactoryBot.create(:song, lang: 'deutsch')
    FactoryBot.create(:song, lang: 'Deutsch')

    assert_equal(['english', 'afrikaans', 'deutsch'], Song.languages)
  end

  test 'search' do
    test_string = "I have come to the f[C#m]ountain[C7]\nOf life"
    song = FactoryBot.create(:song, lyrics: test_string)

    ignores_chords = "fountain"
    ignores_newlines = "fountainOf life"
    ignores_case = "of life"
    everything = "fountain of life"
    assert_equal([song], Song.search(ignores_chords))
    assert_equal([song], Song.search(ignores_newlines))
    assert_equal([song], Song.search(ignores_case))
    assert_equal([song], Song.search(everything))
  end
end