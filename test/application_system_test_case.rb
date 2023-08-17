require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  # If you want to see the browser window open up and go through all the
  # motions, use this line instead:
  #
  # driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
  driven_by :selenium, using: :headless_chrome, screen_size: [1400, 1400]

  Capybara.default_max_wait_time = 3
end
