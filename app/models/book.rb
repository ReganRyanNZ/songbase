class Book < ApplicationRecord
  has_many :song_books, dependent: :destroy
  has_many :songs, through: :song_books

end