class AddLyricsToSongs < ActiveRecord::Migration[5.0]
  def change
    add_column :songs, :lyrics, :text
  end
end
