namespace :import do
  desc "Import .song files from /songs"
  task :songs, [:folder_path] => [:environment] do |t, args|
    # for each .song file in /songs
    # Song.create(...)
    # delete file
    @files = Dir.glob("#{args[:folder_path]}/*.song").map do |song_file|
      puts "loading #{song_file}"
      song = Song.new(lang: 'en')
      lyrics = []
      content = File.read(song_file)
      content.split(/\n|\r/).each do |line|
        if matches = (line.match /\{[Tt]itle: (?<title>.*)\}/)
          song.firstline_title = matches[:title]
        elsif matches = (line.match /\{section: (?<section>.*)\}/)
        # elsif matches = (line.match /\.*[Cc]apo.+(?<capo>[0-9]).*/)
          # song.suggested_capo = matches[:capo]
        else
          lyrics.push(line)
        end
      end

      if lyrics.size > 0
        song.lyrics = lyrics.join("\n")
        song.firstline_title = song.guess_firstline_title if song.firstline_title.blank?
        song.chorus_title = song.guess_chorus_title
        song.save!
      end
    end

  end
end




