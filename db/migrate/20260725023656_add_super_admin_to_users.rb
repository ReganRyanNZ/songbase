class AddSuperAdminToUsers < ActiveRecord::Migration[7.1]
  ALLOWLISTED_EMAILS = %w[
    regan.ryan.nz@gmail.com
    readjethro@gmail.com
  ].freeze

  def up
    add_column :users, :super_admin, :boolean, null: false, default: false

    # Preserve existing access for the two emails that were hardcoded in
    # the old ApplicationController allowlist.
    User.where(email: ALLOWLISTED_EMAILS).update_all(super_admin: true)
  end

  def down
    remove_column :users, :super_admin
  end
end
