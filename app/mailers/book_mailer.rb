class BookMailer < ApplicationMailer
  # Sent when a book is created with a contact email. Carries two share links
  # (read-only, and edit-access for co-editors / other devices). The author edits
  # from the device they created the book on; no direct web-edit link is exposed.
  def book_created(book)
    @book = book
    @share_url      = root_url(add_book: book.id)
    @share_edit_url = root_url(add_book: book.id, edit_token: book.edit_token)

    mail(
      to: book.email,
      from: SUPPORT_EMAIL,
      subject: "Your Songbase book “#{@book.name}” — share links for your records"
    )
  end
end
