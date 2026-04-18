namespace :analytics do
  desc "Clean up song analytics older than 90 days"
  task cleanup: :environment do
    deleted = SongAnalytic.cleanup_old(90)
    puts "Deleted #{deleted} analytics records older than 90 days"
  end
end
