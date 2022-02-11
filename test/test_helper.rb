ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require "minitest/rails"
require 'factory_bot_rails'

class ActiveSupport::TestCase
  require 'minitest/reporters'
  MiniTest::Reporters.use! MiniTest::Reporters::SpecReporter.new
end
