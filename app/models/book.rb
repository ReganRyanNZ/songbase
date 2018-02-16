class Book < ApplicationRecord
  has_many :song_books
  has_many :songs, through: :song_book

end