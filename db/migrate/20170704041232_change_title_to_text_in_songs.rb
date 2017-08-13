class ChangeTitleToTextInSongs < ActiveRecord::Migration[5.0]
  def change
    remove_column :songs, :title, :string
    add_column :songs, :titles, :text
  end
end
