class RemoveDeprecatedTitlesFromSongs < ActiveRecord::Migration[6.1]
  def change
    remove_column :songs, :chorus_title
    remove_column :songs, :custom_title
    rename_column :songs, :firstline_title, :title
  end
end
