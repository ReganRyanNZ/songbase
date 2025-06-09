class AddOwnersToBooks < ActiveRecord::Migration[7.1]
  def change
    add_column :books, :owners, :json, default: []
  end
end
