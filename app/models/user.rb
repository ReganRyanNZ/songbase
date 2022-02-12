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

  def self.test_user
    user = find_or_initialize_by(provider: "localhost", uid: "abcde12345")
    user.name = "Test User"
    user.email = "regan.ryan.nz@gmail.com" # use regan's email to test superadmin
    # user.email = "test@example.com" # use test to test normal admin
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
