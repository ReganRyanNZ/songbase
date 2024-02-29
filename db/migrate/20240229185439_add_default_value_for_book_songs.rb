class AddDefaultValueForBookSongs < ActiveRecord::Migration[7.1]
  def change
    change_column_default :books, :songs, from: nil, to: {}
    change_column_default :books, :languages, from: nil, to: []
  end
end
