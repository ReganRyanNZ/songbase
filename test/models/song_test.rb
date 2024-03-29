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
    song2 = FactoryBot.create(:song, lyrics: 'Uh oh, no chords here')
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

    song4 = FactoryBot.create(:song, title: 'hmmm')
    song5 = FactoryBot.create(:song, title: 'hmmm')
    song5.destroy_with_audit
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

  test 'destroying a song (with audit or not) should remove any reference in books to that song' do
    book = FactoryBot.create(:book, :with_songs)
    song1 = book.song_records.first
    song2 = book.song_records.last

    song1.destroy_with_audit
    song2.destroy

    assert_equal({}, book.reload.songs)
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

  test 'title is stripped of whitespace on save' do
    song = FactoryBot.create(:song, title: ' Weird title that comes up first in index')
    assert_equal('Weird title that comes up first in index', song.title)
  end

  test 'language_links' do
    song1 = FactoryBot.create(:song)
    song2 = FactoryBot.create(:song, :portuguese)

    assert_equal([], song1.language_links)

    song1.language_links = [song2.id]
    song1.save

    assert_equal([song2.id], song1.reload.language_links)
    assert_equal([song1.id], song2.reload.language_links)

    song1.update(language_links: [])

    assert_equal([], song1.reload.language_links)
    assert_equal([], song2.reload.language_links)

    song1.language_links = [song2.id]
    song1.save

    assert_equal([song1.id], song2.reload.language_links)
    song1.destroy
    assert_equal([], song2.reload.language_links)
  end

  test 'print_format' do
    song = FactoryBot.create(:song, :abba_father)
    assert(song.print_format.include?(expected_print_format), "Expected: \n\n" + expected_print_format.inspect + "----\n\n Got: \n\n" + song.print_format.inspect)
  end

  def expected_print_format
    "\t# Capo 2\n"\
    "\t\n"\
    "\t\t  D        G        \n"\
    "\t\tAbba, Father!\n"\
    "\t\t  D               A                     D      \n"\
    "\t\tHow sweet it is to call on Your name!\n"\
    "\t\t        G        \n"\
    "\t\tAbba, Father!\n"\
    "\t\t  D     A       D     \n"\
    "\t\tWe love You!\n"\
    "\t\n"\
    "\t G                    D          \n"\
    "1\tIs it just us or is it Him?\n"\
    "\t G                     D                \n"\
    "\tThe Spirit of the Son You sent us?\n"\
    "\t G                         D            \n"\
    "\tFrom deep within this mingled cry,\n"\
    "\t G     A        D       \n"\
    "\t“Abba, Father!”\n"\
    "\t\n"\
    "2\tHere at the table with the saints\n"\
    "\tYour sons enjoy the life You gave us.\n"\
    "\tLed by Your firstborn Son we cry,\n"\
    "\t“Abba, Father!”\n"\
    "\t\n"\
    "3\tHe leads the many sons to sing\n"\
    "\tThe praises of our holy Father.\n"\
    "\tIn life we understand this name:\n"\
    "\tAbba, Father!\n"\
    "\t\n"\
    "4\tAmidst the church He leads the praise;\n"\
    "\tHe’s not ashamed to call us brothers,\n"\
    "\tFor just like Him we are of You,\n"\
    "\tBorn sons of God!\n"\
    "\t\n"\
    "\t\tAbba, Father!\n"\
    "\t\tHow sweet it is to call on Your name!\n"\
    "\t\tAbba, Father!\n"\
    "\t\tWe’re Your Sons!"
  end
end
