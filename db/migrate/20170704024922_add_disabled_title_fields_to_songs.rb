class AddDisabledTitleFieldsToSongs < ActiveRecord::Migration[5.0]
  def change
    add_column :songs, :disabled_title, :boolean, default: false
    add_column :songs, :disabled_firstline_title, :boolean, default: false
    add_column :songs, :disabled_chorus_title, :boolean, default: false
  end
end
