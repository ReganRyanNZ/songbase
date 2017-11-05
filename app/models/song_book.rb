class SongBook < ApplicationRecord
  belongs_to :book
  belongs_to :song

end