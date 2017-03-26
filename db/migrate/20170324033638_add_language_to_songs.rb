class AddLanguageToSongs < ActiveRecord::Migration[5.0]
  def change
    add_column :songs, :lang, :string, default: "en"
  end
end
