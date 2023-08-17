class AddSongsToBooks < ActiveRecord::Migration[7.0]
  def change
    add_column :books, :songs, :jsonb
    add_column :books, :languages, :string, array: true
  end
end
