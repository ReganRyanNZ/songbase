class AddTitleToSong < ActiveRecord::Migration[5.0]
  def change
    add_column :songs, :title, :string
  end
end
