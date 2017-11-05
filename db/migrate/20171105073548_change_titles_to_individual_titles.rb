class ChangeTitlesToIndividualTitles < ActiveRecord::Migration[5.0]
  def change
    remove_column :songs, :titles, :text
    add_column :songs, :firstline_title, :string
    add_column :songs, :chorus_title, :string
    add_column :songs, :custom_title, :string
  end
end
