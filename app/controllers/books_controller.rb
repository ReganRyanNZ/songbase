class BooksController < ApplicationController
  before_action :set_book, only: [:edit, :update, :destroy]
  before_action :load_songs, only: [:new, :edit, :create, :update]

  def new
    @book = Book.new
    @songs = Song.all
    render :new
  end

  def edit
    @songs = Song.all
    render :edit
  end

  def create
    @book = Book.new(book_params)

    if @book.save
      redirect_to root_path, notice: "Book was successfully created"
    else
      render :new
    end
  end

  def update
    if @book.update(book_params)
      redirect_to root_path, notice: "Book was successfully updated"
    else
      render :edit
    end
  end

  def destroy
    @book.update(deleted_at: Time.current)
    redirect_to root_path, notice: "Book was successfully deleted"
  end

  private

  def set_book
    @book = Book.find(params[:id])
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
