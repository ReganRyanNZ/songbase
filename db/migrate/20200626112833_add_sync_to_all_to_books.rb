class AddSyncToAllToBooks < ActiveRecord::Migration[5.2]
  def change
    add_column :books, :sync_to_all, :boolean, default: false
  end
end
