class RemoveDeadSongs < ActiveRecord::Migration[6.1]
  def change
    drop_table :dead_songs
    add_column :songs, :deleted_at, :datetime
    add_column :songs, :deleted_by, :integer
  end
end
