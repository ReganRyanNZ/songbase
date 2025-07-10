class AddOwnerToBooks < ActiveRecord::Migration[7.1]
  def change
    add_reference :books, :owner, foreign_key: { to_table: :users }
  end
end
