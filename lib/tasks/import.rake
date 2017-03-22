namespace :import do
  desc "Import .song files from /songs"
  task :songs => :environment do
    # for each .song file in /songs
    # Song.create(...)
    # delete file
  end
end
