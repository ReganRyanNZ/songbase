class RemoveDisabledFields < ActiveRecord::Migration[5.0]
  def change
    remove_column :songs, :disabled_title, :boolean, default: false
    remove_column :songs, :disabled_firstline_title, :boolean, default: false
    remove_column :songs, :disabled_chorus_title, :boolean, default: false
  end
end
