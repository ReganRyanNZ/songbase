class AddSuggestedCapoToSongs < ActiveRecord::Migration[5.0]
  def change
    add_column :songs, :suggested_capo, :integer
  end
end
