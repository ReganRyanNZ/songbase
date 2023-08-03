class User < ApplicationRecord
  has_many :audits

  def self.from_google(google_id)
    google_data = GoogleSignIn::Identity.new(google_id)
    user = find_or_initialize_by(provider: 'google', uid: google_id)
    user.name = google_data.name
    user.email = google_data.email_address
    user.save!
    user
  end

  def self.test_user(role = :admin)
    emails = {admin: "regan.ryan.nz@gmail.com", user: "test@example.com"}
    names = {admin: 'Test Admin User', user: "Test User"}
    user = find_or_initialize_by(provider: "localhost", uid: "abcde12345")
    user.email = emails[role]
    user.name = names[role]
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
end
