class AddLangToBook < ActiveRecord::Migration[5.0]
  def change
    add_column :books, :lang, :string
  end
end
