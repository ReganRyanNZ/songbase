class AddAliasToBook < ActiveRecord::Migration[5.0]
  def change
    add_column :books, :alias, :string
  end
end
