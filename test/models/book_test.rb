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
end
