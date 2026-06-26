class AddEmailToBooks < ActiveRecord::Migration[7.1]
  def change
    add_column :books, :email, :string
  end
end
