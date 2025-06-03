class BooksController < ApplicationController
 def list
    @book = Book.find(params[:book_slug])
    song_ids = @book.songs.keys.map(&:to_i)
    @songs = Song.where(id: song_ids)
  end

  def admin
    @books = Book.all()
    @users = User.all()
  end

  def new
    @book = Book.new
    @songs = Song.all()
  end

  def edit
    @book = Book.find(params[:id])
    @songs = Song.all()
  end

  def create
  end

  def update
    @book = Book.find(params[:id])

    if @book.update(book_params)
      redirect_to @book, notice: "Book was successfully updated"
    else
      render :edit
    end
  end
end