class BooksController < ApplicationController
  before_action :set_book, only: [:edit, :update, :destroy]
  before_action :verify_edit_token, only: [:edit, :update, :destroy]

  def new
    @book = Book.new
    render :new
  end

  def edit
    render :edit
  end

  def create
    @book = Book.new(book_params)

    if @book.save
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

  def verify_edit_token
    return if super_admin
    unless @book.edit_token == params[:edit_token]
      redirect_to root_path, alert: "You don't have permission to edit this book"
    end
  end

  def book_params
    permitted = params.require(:book).permit(:name, :songs, :languages)

    permitted[:songs] = JSON.parse(permitted[:songs]) rescue {} if permitted[:songs].is_a?(String)
    permitted[:languages] = JSON.parse(permitted[:languages]) rescue [] if permitted[:languages].is_a?(String)

    permitted
  end
end
