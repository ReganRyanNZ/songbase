class BookMailer < ApplicationMailer
  # Sent when a book is created with a contact email. Carries two share links
  # (read-only, and edit-access for co-editors / other devices). The author edits
  # from the device they created the book on; no direct web-edit link is exposed.
  def book_created(book)
    @book = book
    @share_url      = root_url(add_book: book.share_code)
    @share_edit_url = root_url(add_book: book.share_code, edit_token: book.edit_token)

    mail(
      to: book.email,
      from: SUPPORT_EMAIL,
      subject: "Your Songbase book “#{@book.name}” — share links for your records"
    )
  end

  # Admin-side notification for the same event: who created a book, what's in
  # it, and where to manage it. Sent on every book creation, even when the
  # creator didn't leave a contact email.
  def book_created_admin(book)
    @book = book
    @song_count = (book.songs || {}).size
    @admin_books_url = "#{root_url}admin/books"

    mail(
      to: SUPPORT_EMAIL,
      from: SUPPORT_EMAIL,
      subject: "New book created: “#{book.name}”"
    )
  end
end
