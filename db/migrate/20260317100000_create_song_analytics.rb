class CreateSongAnalytics < ActiveRecord::Migration[7.1]
  def change
    create_table :song_analytics do |t|
      t.integer :song_id, null: false
      t.date :counted_on, null: false
      t.integer :count, null: false, default: 1
    end

    add_index :song_analytics, [:song_id, :counted_on], unique: true
  end
end
