class AddSongTunesToBooks < ActiveRecord::Migration[7.1]
  def change
    add_column :books, :song_tunes, :jsonb, null: false, default: {}
  end
end
