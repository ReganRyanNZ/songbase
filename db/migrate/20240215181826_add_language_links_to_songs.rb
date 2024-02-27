class AddLanguageLinksToSongs < ActiveRecord::Migration[7.1]
  def change
    add_column :songs, :language_links, :integer, array: true, default: []
  end
end
