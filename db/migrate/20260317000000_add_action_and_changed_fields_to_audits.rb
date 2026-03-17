class AddActionAndChangedFieldsToAudits < ActiveRecord::Migration[7.1]
  def change
    add_column :audits, :action, :string
    add_column :audits, :changed_fields, :jsonb, default: {}
  end
end
