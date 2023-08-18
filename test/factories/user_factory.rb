FactoryBot.define do
  factory :user do
    provider { "facebook" }
    uid { "MyString" }
    name { "MyString" }
    oauth_token { "MyString" }
    oauth_expires_at { "2017-12-05 13:55:55" }
  end
end
