Rails.application.configure do
  config.google_sign_in.client_id     = ENV['google_sign_in_client_id']
  config.google_sign_in.client_secret = ENV['google_sign_in_client_secret']
  # config.google_sign_in.root = "admin/google_sign_in"
end