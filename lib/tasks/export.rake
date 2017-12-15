namespace :export do
  desc "Export .song files for all db songs"
  task songs: :environment do |args|
    Song.all.each do |song|
      title = [song.custom_title, song.firstline_title, song.chorus_title, "unknown_#{song.id}"].reject(&:blank?).first
      File.open("export/#{title}.song", "w") do |f|
        lyrics = song.lyrics.gsub(/^\#\s?([^\n\r]*)/, '{comments: \1}')
        f.write(lyrics)
      end
    end
  end
end




