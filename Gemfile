ruby '2.6.6'

source 'https://rubygems.org'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

gem 'rails', '~> 6.1'
# Use postgres as the database for Active Record
gem 'pg', '~> 1.2'
# Use Puma as the app server
gem 'puma'
# Speed profiler
gem 'rack-mini-profiler', require: false
# Use SCSS for stylesheets
gem 'sassc-rails'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier'

gem 'react-rails'

gem 'google_sign_in'

#Api gems
gem 'active_model_serializers'

gem 'jbuilder'

gem 'slim-rails'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platform: :mri
  gem 'minitest-rails'
  gem 'minitest-reporters'
  gem 'guard-rspec'
  gem 'factory_bot_rails'
  gem 'dotenv-rails'
end

group :development do
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem 'web-console'
  gem 'listen'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'spring-watcher-listen'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
