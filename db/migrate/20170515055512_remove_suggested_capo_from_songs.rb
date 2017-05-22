class RemoveSuggestedCapoFromSongs < ActiveRecord::Migration[5.0]
  def change
    remove_column :songs, :suggested_capo, :integer, default: 0, null: false
  end
end
