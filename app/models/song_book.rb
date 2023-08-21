class SongBook < ApplicationRecord
  # belongs_to :book
  # belongs_to :song
  # scope :for_books, ->(books) { books.present? ? where(book_id: books.map(&:id)) : all }
  # scope :deleted_after, ->(time) { where(song_id: Song.deleted_after(time).select(:id))
  #                                   .or(where('deleted_at >= ?', time).where('created_at < ?', time)) }
  # def app_entry
  #   {
  #     id: id,
  #     song_id: song_id,
  #     book_id: book_id,
  #     index: index
  #   }
  # end

  # def self.app_data
  #   all.map(&:app_entry)
  # end
end
