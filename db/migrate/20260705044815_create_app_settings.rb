class CreateAppSettings < ActiveRecord::Migration[7.1]
  def change
    create_table :app_settings do |t|
      t.string :key
      t.text :value

      t.timestamps
    end
    add_index :app_settings, :key, unique: true
  end
end
