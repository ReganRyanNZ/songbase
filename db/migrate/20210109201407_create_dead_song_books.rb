class CreateDeadSongBooks < ActiveRecord::Migration[5.2]
  def change
    add_column :song_books, :deleted_at, :datetime
  end
end
