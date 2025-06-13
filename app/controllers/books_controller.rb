class BooksController < ApplicationController
  before_action :set_book, only: [:edit, :update, :list]
  before_action :load_songs, only: [:new, :edit, :create, :update, :list]

  def list
    @book = Book.find(params[:book_slug])
    song_ids = @book.songs.keys.map(&:to_i)
    @songs = Song.where(id: song_ids).to_a
  end

  def admin
    @books = Book.all
  end

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
      redirect_to admin_book_path(@book.slug), notice: "Book was successfully created"
    else
      render :form
    end
  end

  def update
    @book = Book.find(params[:book_slug])
    if @book.update(book_params)
      redirect_to admin_books_path, notice: "Book was successfully updated"
    else
      @songs = Song.all
      render :edit
    end
  end

  private

  def set_book
    @book = Book.find(params[:book_slug])
  end

  def load_songs
    @songs = Song.all
  end

  def book_params
    permitted = params.require(:book).permit(:name, :songs, :languages)

    permitted[:songs] = JSON.parse(permitted[:songs]) rescue {} if permitted[:songs].is_a?(String)
    permitted[:languages] = JSON.parse(permitted[:languages]) rescue [] if permitted[:languages].is_a?(String)

    permitted
  end
end
