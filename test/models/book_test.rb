require 'test_helper'

class BookTest < ActiveSupport::TestCase
  test ".songs returns songs indexed in the book" do
    skip("Needs to be revisited when api v2 is done")
    book = FactoryBot.create(:book, :with_songs)
    assert_equal 3, book.songs.count
  end
end