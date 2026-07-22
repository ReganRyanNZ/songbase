class CreateBookAudits < ActiveRecord::Migration[7.1]
  def change
    create_table :book_audits, id: :serial do |t|
      t.integer :book_id
      t.integer :user_id
      t.string :action
      t.jsonb :changed_fields, default: {}
      t.datetime :time, precision: nil

      t.timestamps
    end
    add_index :book_audits, :book_id
    add_index :book_audits, :user_id
  end
end
