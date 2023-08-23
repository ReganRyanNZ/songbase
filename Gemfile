ruby '3.2.2'

source 'https://rubygems.org'

gem 'rails', '~> 7.0'
# Use postgres as the database for Active Record
gem 'pg', '~> 1.5'
# Use Puma as the app server
gem 'puma'

gem 'dotenv-rails', require: 'dotenv/rails-now', groups: [:development, :test]

# Heroku will timeout after 30s, but while the client gets an error, puma will
# not realize the request has been terminated, and will continue the process.
# This gem allows us to set a timeout for puma.
gem "rack-timeout"

# Speed profiler
gem 'rack-mini-profiler', require: false
# Use SCSS for stylesheets
gem 'sassc-rails'
gem 'terser'

gem 'react-rails'

gem 'google_sign_in'

#Api gems
gem 'active_model_serializers'
gem 'jbuilder'

gem 'serviceworker-rails' # Offline page loading

group :development, :test do
  gem 'byebug', platform: :mri
  gem 'capybara'
  gem 'factory_bot_rails'
end

group :test do
  gem 'minitest-rails'
  gem 'minitest-reporters'
  gem 'selenium-webdriver'
end

group :development do
  gem 'listen'
  gem 'spring-watcher-listen'
  gem 'spring'
  gem 'web-console'
end
