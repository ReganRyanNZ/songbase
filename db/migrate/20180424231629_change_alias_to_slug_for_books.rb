class ChangeAliasToSlugForBooks < ActiveRecord::Migration[5.0]
  def change
    remove_column :books, :alias, :string
    add_column :books, :slug, :string, index: {unique: true}
  end
end
