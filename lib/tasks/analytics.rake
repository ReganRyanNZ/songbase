namespace :analytics do
  desc "Clean up song analytics older than 90 days"
  task cleanup: :environment do
    deleted = SongAnalytic.cleanup_old(90)
    puts "Deleted #{deleted} analytics records older than 90 days"
  end

  desc "Consolidate daily analytics older than 7 days into monthly aggregates"
  task rollup: :environment do
    months = SongAnalytic.rollup!
    puts "Consolidated analytics into #{months} monthly aggregate(s)"
  end
end
