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
    assert_includes body, "add_book=#{book.share_code}"         # read-only share link (share code, not id)
    assert_includes body, "edit_token=#{book.edit_token}"       # share-edit (edit access) link
    # No direct web-edit page link is exposed — only the device-share links:
    refute_includes body, "/books/#{book.id}/edit"
  end

  test 'book_created_admin notifies the support address with an admin summary' do
    book = FactoryBot.create(:book,
                             name: 'My Hymnal',
                             email: 'author@example.com',
                             languages: ['english'],
                             songs: { '1' => '0', '2' => '1' })

    email = BookMailer.book_created_admin(book).deliver_now

    assert_equal ['songbase.brothers@gmail.com'], email.to
    assert_includes email.subject, 'My Hymnal'

    body = [email.text_part&.body&.decoded, email.html_part&.body&.decoded].join("\n")
    assert_includes body, 'author@example.com'                  # creator contact
    assert_includes body, 'english'                             # languages
    assert_includes body, 'Songs: 2'                            # song count
    assert_includes body, 'admin/books'                         # management link
  end

  test 'book_created_admin notes when the creator left no contact email' do
    book = FactoryBot.create(:book, name: 'Quiet Book', email: nil)

    email = BookMailer.book_created_admin(book).deliver_now

    body = [email.text_part&.body&.decoded, email.html_part&.body&.decoded].join("\n")
    assert_includes body, 'no contact email'
  end
end
