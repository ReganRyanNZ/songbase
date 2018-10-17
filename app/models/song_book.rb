class SongBook < ApplicationRecord
  belongs_to :book
  belongs_to :song

  def app_entry
    {
      id: id,
      song_id: song_id,
      book_id: book_id,
      index: index
    }
  end

  def self.app_data
    all.map(&:app_entry)
  end
end