class Book < ApplicationRecord
  has_many :song_book
  has_many :songs, through: :song_book

end