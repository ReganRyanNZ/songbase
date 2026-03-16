class AddSyncToAllChangedAtToBooks < ActiveRecord::Migration[7.1]
  def change
    add_column :books, :sync_to_all_changed_at, :datetime
  end
end
