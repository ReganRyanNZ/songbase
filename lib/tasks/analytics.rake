# NOTE: Schedule this task to run daily via Heroku Scheduler:
#   heroku addons:create scheduler:standard
#   heroku addons:open scheduler
#   Add command: rake analytics:rollup
namespace :analytics do
  desc "Roll up daily analytics older than 7 days into monthly aggregates and delete the originals"
  task rollup: :environment do
    SongAnalytic.rollup!
    puts "Analytics rollup complete."
  end
end
