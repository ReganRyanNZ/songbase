class AddDeletedAtToBooks < ActiveRecord::Migration[5.2]
  def change
    add_column :books, :deleted_at, :datetime
  end
end
