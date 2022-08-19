class AddDeletedAtToSongBook < ActiveRecord::Migration[6.1]
  def change
    add_column :song_books, :deleted_at, :datetime
  end
end
