class BooksController < ApplicationController
  before_action :set_book, only: [:edit, :update, :destroy]
  before_action :verify_edit_token, only: [:edit, :update, :destroy]
  before_action :set_duplicatable_books, only: [:new, :edit]
  before_action :require_super_admin, only: [:restore]

  layout "admin", only: [:admin_index, :new, :edit, :create, :update]

  def new
    @book = Book.new

    if params[:from].present?
      source = Book.find_by(id: params[:from]) || Book.find_by(slug: params[:from])
      # Only allow duplicating public books, or any book for a super admin —
      # otherwise a hand-crafted URL could leak a private book's song list.
      if source && (source.sync_to_all || super_admin)
        @book.name = "#{source.name} (copy)"
        @book.songs = source.songs.dup
        @book.languages = source.languages.dup
        @seeded_songs = source.song_records.map(&:admin_entry)
      end
    end

    render :new
  end

  def edit
    render :edit
  end

  def create
    @book = Book.new(book_params)

    if @book.save
      BookMailer.book_created(@book).deliver_later if @book.email.present?
      redirect_to "/#{@book.slug}/i?new_book=#{@book.id}&edit_token=#{@book.edit_token}", notice: "Book was successfully created"
    else
      render :new
    end
  end

  def update
    if @book.update(book_params)
      redirect_to "/#{@book.slug}/i", notice: "Book was successfully updated"
    else
      render :edit
    end
  end


  def destroy
    @book.update(deleted_at: Time.current)
    redirect_to root_path, notice: "Book was successfully deleted"
  end

  # Super-admin: restore a soft-deleted book.
  def restore
    book = Book.unscoped.find(params[:id])
    book.restore
    redirect_to admin_trash_path, notice: "Restored '#{book.name}'."
  end

  def admin_index
    unless super_admin
      redirect_to root_path, alert: "Super admin only"
      return
    end
    @books = Book.order(:name).map { |b|
      { id: b.id, name: b.name, slug: b.slug, edit_token: b.edit_token, song_count: (b.songs || {}).size, downloads: b.downloads, sync_to_all: b.sync_to_all, created_at: b.created_at }
    }
  end

  private

  def set_book
    @book = Book.find(params[:id])
  end

  # Books offered as a "duplicate from" starting point, and as the source-book
  # selector for bulk import by hymnal numbers. Public books for everyone; all
  # books for super admins.
  def duplicatable_books
    scope = super_admin ? Book.all : Book.where(sync_to_all: true)
    scope.order(:name).map { |book| { id: book.id, name: book.name } }
  end

  def set_duplicatable_books
    @duplicatable_books = duplicatable_books
  end

  def verify_edit_token
    return if super_admin
    unless @book.edit_token == params[:edit_token]
      redirect_to root_path, alert: "You don't have permission to edit this book"
    end
  end

  def book_params
    permitted = params.require(:book).permit(:name, :email, :songs, :languages)

    permitted[:songs] = JSON.parse(permitted[:songs]) rescue {} if permitted[:songs].is_a?(String)
    permitted[:languages] = JSON.parse(permitted[:languages]) rescue [] if permitted[:languages].is_a?(String)

    permitted
  end
end
