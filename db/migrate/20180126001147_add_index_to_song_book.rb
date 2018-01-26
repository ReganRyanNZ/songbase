class AddIndexToSongBook < ActiveRecord::Migration[5.0]
  def change
    add_column :song_books, :index, :string
  end
end
