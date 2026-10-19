class User < ApplicationRecord
  has_many :audits

  # Look up or create a local User row from a Clerk user object.
  # Keys off email so existing audit history keeps working. New users
  # default to super_admin = false; grant it in the DB to elevate.
  def self.from_clerk(clerk_user)
    email = primary_email(clerk_user)
    return nil unless email

    user = find_or_initialize_by(email: email)
    user.name = clerk_display_name(clerk_user) || email
    user.provider = "clerk"
    user.uid = clerk_user.id
    user.save!
    user
  end

  def self.test_user(role = :admin)
    emails = {admin: "regan.ryan.nz@gmail.com", user: "test@example.com"}
    names = {admin: 'Test Admin User', user: "Test User"}
    user = find_or_initialize_by(provider: "localhost", uid: "abcde12345")
    user.email = emails[role]
    user.name = names[role]
    user.super_admin = (role == :admin)
    user.save!
    user
  end

  def self.system_user
    user = find_or_initialize_by(provider: "system", uid: "abcde12345")
    user.name = "System"
    user.email = "songbase.brothers@gmail.com"
    user.save!
    user
  end

  def self.primary_email(clerk_user)
    primary = clerk_user.email_addresses&.find do |addr|
      addr.id == clerk_user.primary_email_address_id
    end
    primary&.email_address || clerk_user.email_addresses&.first&.email_address
  end

  def self.clerk_display_name(clerk_user)
    [clerk_user.first_name, clerk_user.last_name].compact.join(" ").presence
  end
end
