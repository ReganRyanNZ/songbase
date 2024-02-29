class CleanUpBooks < ActiveRecord::Migration[7.1]
  def change
    remove_column :books, :lang, :string
    drop_table :song_books
  end
end
