class CreateBooks < ActiveRecord::Migration[5.0]
  def change
    create_table :books do |t|
      t.string :name

      t.timestamps
    end

    create_table :song_lists, id: false do |t|
      t.belongs_to :song, index: true
      t.belongs_to :book, index: true
      t.integer :book_index
      t.timestamps
    end
  end
end
