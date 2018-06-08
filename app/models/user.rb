class User < ApplicationRecord
  has_many :audits

  def self.from_omniauth(auth)
    user = find_or_initialize_by(provider: auth.provider, uid: auth.uid)
    user.name = auth.info.name
    user.email = auth.info.email
    user.oauth_token = auth.credentials.token
    user.oauth_expires_at = Time.at(auth.credentials.expires_at)
    user.save!
    user
  end

  def self.test_user
    user = find_or_initialize_by(provider: "localhost", uid: "abcde12345")
    user.name = "Test User"
    user.email = "test@example.com"
    user.oauth_token = "abcde12345"
    user.oauth_expires_at = Time.now + 7.days
    user.save!
    user
  end
end
