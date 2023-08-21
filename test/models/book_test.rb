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
end
