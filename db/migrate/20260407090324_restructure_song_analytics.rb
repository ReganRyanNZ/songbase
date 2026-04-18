class RestructureSongAnalytics < ActiveRecord::Migration[7.0]
  def up
    drop_table :song_analytics, if_exists: true

    create_table :song_analytics do |t|
      t.date :date, null: false
      t.jsonb :song_counts, null: false, default: {}
      t.timestamps
    end

    add_index :song_analytics, :date, unique: true
  end

  def down
    drop_table :song_analytics

    create_table :song_analytics do |t|
      t.integer :song_id
      t.date :counted_on
      t.integer :count
    end

    add_index :song_analytics, :song_id
  end
end
