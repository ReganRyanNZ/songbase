class AddLastEditorToSongs < ActiveRecord::Migration[5.0]
  def change
    add_column :songs, :last_editor, :string
  end
end
