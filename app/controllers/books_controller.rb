class BooksController < ApplicationController
 def list
    @book = Book.find(params[:book_slug])
    song_ids = @book.songs.keys.map(&:to_i)
    @songs = Song.where(id: song_ids)
end

  def admin
    @books = Book.all()
  end

  def new
  end

  def create
  end
end