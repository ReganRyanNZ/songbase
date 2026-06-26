require 'test_helper'

class BookMailerTest < ActionMailer::TestCase
  test 'book_created delivers to the book email with the share link and name' do
    book = FactoryBot.create(:book, name: 'My Hymnal', email: 'author@example.com')

    email = BookMailer.book_created(book).deliver_now

    assert_not_empty ActionMailer::Base.deliveries
    assert_equal ['author@example.com'], email.to
    assert_equal ['songbase.brothers@gmail.com'], email.from
    assert_includes email.subject, 'My Hymnal'

    body = [email.text_part&.body&.decoded, email.html_part&.body&.decoded].join("\n")
    assert_includes body, 'My Hymnal'
    assert_includes body, "new_book=#{book.id}"                 # read-only share link
    assert_includes body, "edit_token=#{book.edit_token}"       # share-edit (edit access) link
    # No direct web-edit page link is exposed — only the device-share links:
    refute_includes body, "/books/#{book.id}/edit"
  end
end
