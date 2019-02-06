class AddTimeToDeadSongs < ActiveRecord::Migration[5.1]
  def change
    add_column :dead_songs, :time, :datetime
  end
end
