# Puma can serve each request in a thread from an internal thread pool.
# The `threads` method setting takes two numbers: a minimum and maximum.
# Any libraries that use thread pools should be configured to match
# the maximum value specified for Puma. Default is set to 5 threads for minimum
# and maximum; this matches the default thread size of Active Record.
#
max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count
# Cluster mode forks workers, which crashes on macOS due to Objective-C fork-safety
# issues with the pg gem. Single-process mode (workers=0) is fine for local dev.
workers ENV.fetch("WEB_CONCURRENCY") { ENV.fetch("RAILS_ENV", "development") == "production" ? 2 : 0 }


# Specifies the `worker_timeout` threshold that Puma will use to wait before
# terminating a worker in development environments.
#
if ENV.fetch("RAILS_ENV", "development") == "development"
  worker_timeout 3600
end

rackup      DefaultRackup if defined?(DefaultRackup)

# Specifies the `port` that Puma will listen on to receive requests; default is 3000.
port ENV.fetch("PORT") { 3000 }

# Specifies the `environment` that Puma will run in.
environment ENV.fetch("RAILS_ENV") { "development" }

# Specifies the `pidfile` that Puma will use.
pidfile ENV.fetch("PIDFILE") { "tmp/pids/server.pid" }

preload_app!

# Allow puma to be restarted by `rails restart` command.
plugin :tmp_restart
