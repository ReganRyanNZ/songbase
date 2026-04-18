class AddDownloadsToBooks < ActiveRecord::Migration[7.1]
  def change
    add_column :books, :downloads, :integer, default: 0
  end
end
