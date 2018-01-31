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


  desc "Clean badly imported files"
  task clean: :environment do
    Song.all.each do |song|
      if song.lyrics =~ /(\n)?\r(\n)?/
        song.lyrics.gsub!(/(\n)?\r(\n)?/, "\n")
        puts "replaced soft returns"
      end

      if song.lyrics =~ /\{start_of_chorus\}[\s\n\r]*\{end_of_chorus\}/
        song.lyrics.gsub!(/\{start_of_chorus\}[\s\n\r]*\{end_of_chorus\}/, "\n\n")
        puts "took out empty chorus nonsense"
      end

      if song.lyrics =~ /\n\n\n+/
        song.lyrics.gsub!(/\n\n\n+/, "\n\n")
        puts "calmed down new line craziness (too many in a row)"
      end

      if song.chorus_title =~ /{start_of_chorus}/
        song.chorus_title = ""
        puts "taken out {start_of_chorus} title nonsense"
      end

      if song.chorus_title == song.firstline_title
        song.chorus_title = ""
        puts "taken out duplicate chorus title"
      end

      song.save!
    end
  end

  desc "Import songs from the bluesongbook isilo file"
  task bsb: :environment do
    bluesongbook = Book.find_or_create_by(name: "Blue Songbook", lang: "english")
    hymnal = Book.find_or_create_by(name: "Hymnal", lang: "english")
    filename = Rails.root.join('db', 'bsb.txt')
    delim = <<-DELIM


Blue Song Book v4.0
Hymn Selector | FirstLines | Categories
Feedback: songbook.blue@gmail.com | tinyurl.com/BlueBugsReport4
Updated April 2015

DELIM

    File.foreach(filename, delim) do |txt|
      # get rid of delimiter
      txt = txt.chomp(delim)

      # set index
      bsb_index = /Previous Song (\d+) Next Song/.match(txt)[1]
      hymnal_index = nil

      # remove all header chaff
      txt = /.*Word Wrap\n+(.*)/m.match(txt)[1]

      # insert chords into lines, right to left
      lines = txt.split("\n")
      chord_regex = /\A\s*([\/ABCDEFG#bmMsu234579-]+\s*)+\z/
      chorded_lines = []
      lines.each_with_index do |line, i|
        is_chords = line.match(chord_regex)
        if is_chords
          while(m = line.match(/.*\s([^\s]+)/)) do
            chord = "[" + m[1] + "]"
            offset = [m.offset(1).first, lines[i+1].length].min
            lines[i+1].insert(offset, chord)
            line = line[0...offset]
          end
        elsif hymnal_regex_match = /\(Hymns, \#(\d+)/.match(line)
          hymnal_index = hymnal_regex_match[1]
        else
          # remove offset and add to chorded lines
          line = /([\s\d]\s\s)?(.*)/.match(line)[2]

          # comment out comments
          line = /\A\(?(\s*[Pp]art[^a]|[Bb]rothers|[Ss]isters|[Cc]apo|[Rr]epeat|20\d\d|[Nn]ew tune|[Oo]riginal tune|chorus).*|([Ss]tanza|[Cc]horus \d)/.match(line) ? "#" + line : line

          chorded_lines << line
        end
      end
      parsed_lyrics = chorded_lines.join("\n")
      s = Song.new(lyrics: parsed_lyrics, lang: "english")
      s.firstline_title = s.guess_firstline_title
      s.save!
      puts s.firstline_title
      s.song_books.create(book: bluesongbook, index: bsb_index)
      s.song_books.create(book: hymnal, index: hymnal_index) if hymnal_index

    end


  end
end




