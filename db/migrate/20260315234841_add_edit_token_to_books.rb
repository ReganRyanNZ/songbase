class AddEditTokenToBooks < ActiveRecord::Migration[7.1]
  def change
    add_column :books, :edit_token, :string
  end
end
