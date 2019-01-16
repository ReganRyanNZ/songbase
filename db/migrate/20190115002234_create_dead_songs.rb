class CreateDeadSongs < ActiveRecord::Migration[5.1]
  def change
    create_table :dead_songs do |t|
      t.integer :song_id
      t.references :user, foreign_key: true
    end
  end
end
