require 'test_helper'

class BookTest < ActiveSupport::TestCase
  test 'for_language scope' do
    book_1 = FactoryBot.create(:book, languages: ["english", "portuguese"])
    book_2 = FactoryBot.create(:book, languages: ["english"])

    # No language means return everything:
    assert_equal [book_1, book_2], Book.for_language(nil)

    # English is present in both books:
    assert_equal [book_1, book_2], Book.for_language("english")

    # Portuguese is only in one book:
    assert_equal [book_1], Book.for_language("portuguese")
  end

  test 'with_song scope' do
    song = FactoryBot.create(:song, :abba_father)
    FactoryBot.create(:song, :accord_to_my_earnest)
    FactoryBot.create(:book, name: 'Test Book', songs: {song.id => '1'})

    assert_equal ['Test Book'], Book.with_song(song).pluck(:name)
  end

  test 'book_refs_for' do
    song = FactoryBot.create(:song, :abba_father)
    FactoryBot.create(:song, :accord_to_my_earnest)
    FactoryBot.create(:book, name: 'Test Book', songs: {song.id => '1'})

    assert_equal [['test_book', 'Test Book', '1']], Book.with_song(song).book_refs_for(song)
  end

  test 'name is required' do
    book = Book.new(name: '')
    refute book.valid?
    assert_includes book.errors[:name], "is required"
  end

  test 'song_id_from_index returns the song id at a given index' do
    song_1 = FactoryBot.create(:song, :abba_father)
    song_2 = FactoryBot.create(:song, :accord_to_my_earnest)
    book = FactoryBot.create(:book, name: 'Indexed', songs: {song_1.id => '1', song_2.id => '7'})

    assert_equal song_1.id.to_s, book.song_id_from_index('1')
    assert_equal song_2.id.to_s, book.song_id_from_index(7)
    assert_nil book.song_id_from_index('99')
  end

  # Share links use a name-prefix + 5-digit code instead of the numeric id so
  # book ids can't be guessed: "Camp Weekend" → camp-w-48392.
  test 'share_code is generated on create from the first six name characters' do
    book = FactoryBot.create(:book, name: 'Camp Weekend 2026')
    assert_match(/\Acamp-w-\d{5}\z/, book.share_code)

    single_word = FactoryBot.create(:book, name: 'Sunday Services')
    assert_match(/\Asunday-\d{5}\z/, single_word.share_code)
  end

  test 'share_code is unique across books' do
    book_1 = FactoryBot.create(:book, name: 'Camp Weekend 2026')
    book_2 = FactoryBot.create(:book, name: 'Camp Weekend 2026')
    refute_equal book_1.share_code, book_2.share_code
  end

  test 'app_entry exposes the share_code to clients' do
    book = FactoryBot.create(:book, name: 'Camp Weekend 2026')
    assert_equal book.share_code, book.app_entry[:share_code]
  end
end
