offline = Rack::Offline.configure :cache_interval => 120 do
  cache ActionController::Base.helpers.asset_path("application.css")
  cache ActionController::Base.helpers.asset_path("application.js")
  cache ActionController::Base.helpers.asset_path("application.html")
  # cache other assets
  network "/"
end