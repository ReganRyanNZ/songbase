require 'test_helper'

class BookTest < ActiveSupport::TestCase
  test ".songs returns songs indexed in the book" do
    book = FactoryBot.create(:book, :with_songs)
    assert_equal 3, book.songs.count
  end
end