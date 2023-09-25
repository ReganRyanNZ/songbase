Rails.application.configure do
  Rack::Timeout::Logger.logger = Logger.new(STDOUT)
  Rack::Timeout::Logger.level  = Logger::ERROR
end