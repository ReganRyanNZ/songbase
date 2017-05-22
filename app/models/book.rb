class Book < ApplicationRecord
  has_many :songs, through: :song_list

end