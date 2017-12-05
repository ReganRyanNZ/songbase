class CreateAudit < ActiveRecord::Migration[5.0]
  def change
    create_table :audits do |t|
      t.references :user, foreign_key: true
      t.references :song, foreign_key: true
      t.datetime :time
    end
  end
end
