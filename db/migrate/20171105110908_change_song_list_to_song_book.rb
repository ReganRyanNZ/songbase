class ChangeSongListToSongBook < ActiveRecord::Migration[5.0]
  def change
    drop_table "song_lists", id: false, force: :cascade do |t|
      t.integer  "song_id"
      t.integer  "book_id"
      t.integer  "book_index"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["book_id"], name: "index_song_lists_on_book_id", using: :btree
      t.index ["song_id"], name: "index_song_lists_on_song_id", using: :btree
    end

    create_table :song_books do |t|
      t.belongs_to :song, index: true
      t.belongs_to :book, index: true
      t.timestamps
    end


  end
end
