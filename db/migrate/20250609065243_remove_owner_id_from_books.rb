class RemoveOwnerIdFromBooks < ActiveRecord::Migration[7.1]
   def change
    remove_foreign_key :books, :users
    remove_column :books, :owner_id
  end
end
