ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require "minitest/rails"
require 'minitest/reporters'
require 'factory_bot_rails'

class ActiveSupport::TestCase
  Minitest::Reporters.use! Minitest::Reporters::SpecReporter.new
end
