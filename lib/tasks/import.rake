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
        if matches = (line.match(/\{[Tt]itle: (?<title>.*)\}/))
          song.firstline_title = matches[:title]
        elsif matches = (line.match(/\{section: (?<section>.*)\}/))
        # elsif matches = (line.match /\.*[Cc]apo.+(?<capo>[0-9]).*/)
          # song.suggested_capo = matches[:capo]
        else
          lyrics.push(line)
        end
      end

      if lyrics.size > 0
        song.lyrics = lyrics.join("\n")
        song.firstline_title = song.guess_firstline_title if song.firstline_title.blank?
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

  task chinese_refs: :environment do
    chinese_hymnal = Book.chinese_hymnal
    english_hymnal = Book.english_hymnal
    portuguese_hymnal = Book.portuguese_hymnal
    spanish_hymnal = Book.spanish_hymnal
    german_hymnal = Book.german_hymnal
    french_hymnal = Book.french_hymnal

    filename = Rails.root.join('db', 'links.txt')
    File.foreach(filename) do |line|
      next unless line.match?(/ C\d+/)

      puts "processing hymn #{line.match(/E\d+/)[0]}"

      chinese_number = line.match(/ C(\d+)/)[1]
      song = chinese_hymnal.song_at(chinese_number)
      next unless song.present?

      english_match = line.match(/E(\d+)/)
      if english_match
        sister_song = english_hymnal.song_at(english_match[1])
        song.language_links.push(sister_song.id) if sister_song.present?

        # portuguese has a 1-1 match with english
        sister_song = portuguese_hymnal.song_at(english_match[1])
        song.language_links.push(sister_song.id) if sister_song.present?
      end

      spanish_match = line.match(/S(\d+)/)
      if spanish_match
        sister_song = spanish_hymnal.song_at(spanish_match[1])
        song.language_links.push(sister_song.id) if sister_song.present?
      end

      german_match = line.match(/G(\d+)/)
      if german_match
        sister_song = german_hymnal.song_at(german_match[1])
        song.language_links.push(sister_song.id) if sister_song.present?
      end

      french_match = line.match(/FR(\d+)/)
      if french_match
        sister_song = french_hymnal.song_at(french_match[1])
        song.language_links.push(sister_song.id) if sister_song.present?
      end

      song.save! # Song save triggers reverse refs to update too
    end
  end

  desc "Import hymnal"
  namespace "hymnal" do

    # Run this task from a terminal window (in the code's directory) with:
    # `rake import:hymnal:chinese`
    #
    # If something goes wrong and you want to clear up the data:
    # ```
    #   rails console
    #   Book.find_by(slug: :chinese_hymnal).destroy
    #   Song.where(lang: "繁體中文").destroy_all
    # ```
    # If something is still wrong, you can reload the "latest.dump" file
    # according to the readme, to completely reset the db.
    task chinese: :environment do
      language = "繁體中文"
      hymnal = Book.find_or_create_by(slug: :chinese_hymnal, name: "詩歌", languages: [language])
      hymnal.songs = {}
      # Go through the txt file here, you may want to use `File.foreach`, and
      # you might need to use regex to group lines together. The english import
      # task looks pretty good, I think 90% of that code would work here.
      # Some things however are obsolete:
      # - Songs now just have a "title" field, not "firstline_title" or "chorus_title"
      # - Books now have a "languages" field which is an array, instead of a
      #   "lang" string field. This is so one book can have multiple languages.
      #   Song records still have a string "lang" field.
      # - There is no SongBook model any more.
      # - In other imports I did a global find/replace to add an obvious
      #   delimiter to separate the songs for regex. In the chinese txt file
      #   there is only the pattern of two newlines and then a "C123" style
      #   number. You might want to insert a delimiter like I did for the others.
      filename = Rails.root.join('db', 'chinese-hymnal.txt')
      delim = "\nC"
      # For each song:
      File.foreach(filename, delim) do |txt|
        next unless txt[/^\d+/].present?

        hymnal_index = txt.split("\n")[0]
        puts hymnal_index # print index number to the terminal
        txt = txt.sub(/.+\n/, '') # remove the first line, which was the index number
        txt = txt.sub(/\n+C/, '') # remove the delimiter
        txt = txt.gsub(/\nchorus((?:\n[^\n]+)+)/) {$1.gsub("\n", "\n  ")} # pad each chorus line with 2 spaces
        title = txt[/^[^\s\dc].+[^\s]/].sub(/[，。、；]$/, '') # get the first line for title
        song = Song.new
        song.title = title
        song.lyrics = txt
        song.lang = language # this doesn't change
        song.save!
        # Get the database id and the hymnal index (both as strings),
        # and add it to the hymnal:
        db_id = song.id.to_s
        hymnal.songs[db_id] = hymnal_index
        # end loop
      end
      # Save the hymnal to db after all the songs have been added
      hymnal.save
    end


    task korean: :environment do
      # This code is based off the chinese import task
      language = "한국어"
      hymnal_name = "찬송가"
      hymnal = Book.find_or_create_by(slug: :korean_hymnal, name: hymnal_name, languages: [language])
      hymnal.songs = {}

      filename = Rails.root.join('db', 'korean-hymnal.txt')
      delim = "\nK"


      File.foreach(filename, delim) do |txt|
        # puts txt.inspect
        txt = txt.sub(/^\n+K/, '')
        next unless txt[/^\d+/].present?

        lines = txt.split("\n")
        hymnal_index = lines[0]
        title = lines[1]
        language_links = []

        puts "importing #{title} - #{hymnal_index}"

        if txt.match(/Related Hymns:.*/)
          refs = txt.match(/Related Hymns:.*/)[0]

          chinese = refs.match(/ C(\d+)/)
          language_links << Book.chinese_hymnal.song_id_from_index(chinese[1]) if chinese

          english = refs.match(/ E(\d+)/)
          language_links << Book.english_hymnal.song_id_from_index(english[1]) if english
          language_links << Book.portuguese_hymnal.song_id_from_index(english[1]) if english # portuguese use same numbers and have all the english hymns translated

          french = refs.match(/ FR(\d+)/)
          language_links << Book.french_hymnal.song_id_from_index(french[1]) if french

          spanish = refs.match(/ S(\d+)/)
          language_links << Book.spanish_hymnal.song_id_from_index(spanish[1]) if spanish
        end

        txt = txt.split(/\n\n\n+/)[1] # remove content before and after lyrics
        txt = txt.gsub(/\nchorus((?:\n[^\n]+)+)/) {$1.gsub("\n", "\n  ")} # pad each chorus line with 2 spaces

        song = Song.new
        song.title = title
        song.lyrics = txt
        song.lang = language

        song.language_links = language_links

        song.save!

        db_id = song.id.to_s
        hymnal.songs[db_id] = hymnal_index
      end

      hymnal.save
    end

    task german: :environment do
      hymnal = Book.find_or_create_by(slug: :german_hymnal, name: "Liederbuch", lang: "Deutsch")
      filename = Rails.root.join('db', 'german-hymnal.txt')
      delim = "\n**DELIMITER"
      File.foreach(filename, delim) do |txt|
        txt = txt.sub(delim, '')
        hymnal_index = txt[/^\d+/]
        txt = txt.sub(/^\d+/, '')
        chorus_regex = /^\nchorus((?:\n[^\n]+)+)/
        txt = txt.gsub(chorus_regex) {$1.gsub("\n", "\n  ")}
        song = Song.new(lyrics: txt, lang: "Deutsch")
        song.firstline_title = song.guess_firstline_title
        song.save!
        puts song.firstline_title
        song.song_books.create(book: hymnal, index: hymnal_index)
      end
    end

    task french: :environment do
      hymnal = Book.find_or_create_by(slug: :french_hymnal, name: "Cantiques", lang: "français")
      filename = Rails.root.join('db', 'french-hymnal.txt')
      delim = "QWERTY FR"
      File.foreach(filename, delim) do |txt|
        txt = txt.sub(delim, '')

        # assign and remove index number
        hymnal_index = txt[/\d+/]
        txt = txt.sub(/.*\n/, '')

        # replacing newlines after "chorus" to have 2 spaces in front of them
        chorus_regex = /^\nchorus((?:\n[^\n]+)+)/
        txt = txt.gsub(chorus_regex) {$1.gsub("\n", "\n  ")}

        song = Song.new(lyrics: txt, lang: "français")
        song.firstline_title = song.guess_firstline_title
        song.save!
        puts song.firstline_title
        song.song_books.create(book: hymnal, index: hymnal_index)
      end
    end

    task spanish: :environment do
      hymnal = Book.find_or_create_by(slug: :spanish_hymnal, name: "Himnos", lang: "español")
      filename = Rails.root.join('db', 'spanish-hymnal.txt')
      delim = "DELIMITER"
      File.foreach(filename, delim) do |txt|
        txt = txt.sub(delim, '')
        hymnal_index = txt[/\d+/]
        txt = txt.sub(/.*\n\n/, '')

        chorus_regex = /^\nchorus((?:\n[^\n]+)+)/
        txt = txt.gsub(chorus_regex) {$1.gsub("\n", "\n  ")}

        song = Song.new(lyrics: txt, lang: "español")
        song.firstline_title = song.guess_firstline_title
        song.save!
        puts song.firstline_title
        song.song_books.create(book: hymnal, index: hymnal_index)
      end
    end

    task english: :environment do
      hymnal = Book.find_by(name: "Hymnal")
      hymnal.update(alias: :english_hymnal) unless hymnal.alias.present?
      existing_hymns = SongBook.where(book: Book.find_by(name: "Hymnal")).map {|sb| sb.index}
      filename = Rails.root.join('db', 'english-hymnal.txt')
      delim = "\n\nDELIMITER"
      File.foreach(filename, delim) do |txt|
        # get rid of delimiter
        txt = txt.sub(delim, '')

        # get index number
        index_regex = /\AE([0-9]+)\n/
        hymnal_index = txt.match(index_regex)[1]

        # skip if song is already on songbase
        next if existing_hymns.include? hymnal_index

        # remove index number from txt
        txt = txt.sub(txt[index_regex], '')

        # convert 'chorus' to 2-space padding
        chorus_regex = /^\nchorus((?:\n[^\n]+)+)/
        _chorus_match = txt.match(chorus_regex)
        txt = txt.gsub(chorus_regex) {$1.gsub("\n", "\n  ")}

        # create song with lyrics
        song = Song.new(lyrics: txt, lang: "english")
        song.firstline_title = song.guess_firstline_title
        song.save!
        puts song.firstline_title

        # add song to book
        song.song_books.create(book: hymnal, index: hymnal_index)
      end
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

      # cut last delimiter off
      break unless /Previous Song (\d+) Next Song/.match(txt)

      # set index
      bsb_index = /Previous Song (\d+) Next Song/.match(txt)[1]
      hymnal_index = nil

      # remove all header chaff
      txt = /.*Word Wrap\n+(.*)/m.match(txt)[1]

      # comment out comments
      comments_regex = /^ *(\(?(([^#\n]*\d[a-z]|(Goes up a key)|[^#\n]*repeat chorus|\([Pp]arts|[Rr]epeat|20\d\d|[Nn]ew tune|[Oo]riginal tune|[Cc]apo [^\s]|[Ss]tanza ? \S?|[Cc]horus|[Ii]nterlud|[Pp]arts [AB12]|[Bb]anner \d|[^#\n].*\&|\*).*)|([Pp]art [^\s]+|[Bb]rothers\:?|[Ss]isters\:?|Brothers & Sisters)$)/
      txt = txt.sub(comments_regex, '#\1') while txt =~ comments_regex
      # personal vendetta against em dash misuse
      em_dash_regex = /(\S)— (\S)/
      txt = txt.sub(em_dash_regex, '\1—\2') while txt =~ em_dash_regex


      # replace blank lines with dummy [] chords
      verse_blank_line_regex = /(^(?:\s|\d)\s\s[^\s][^#].*\n)(\n\s\s\s[^\s].*[^\n \/ABCDEFG#bmMsu234579\-^])/
      chorus_blank_line_regex = /(^\s\s\s\s\s[^\s][^#].*\n)(\n\s\s\s\s\s[^\s].*[^\n \/ABCDEFG#bmMsu234579\-^])/
        # gsub is not used here because two chordless lines in a row have overlapping regex

      txt = txt.sub(verse_blank_line_regex, '\1   ^\2') while txt =~ verse_blank_line_regex
      txt = txt.sub(chorus_blank_line_regex, '\1     ^\2') while txt =~ chorus_blank_line_regex

      # insert chords into lines, right to left
      lines = txt.split("\n")
      chord_regex = /\A\s*([\/\(\)ABCDEFG#bmMsu234579\-^]+\s*)+\z/
      chorded_lines = []
      lines.each_with_index do |line, i|
        is_chords = line.match(chord_regex)
        if is_chords
          bsb_chord_regex = /.*\s([^\s]+)/ # basically anything not a space, rightmost first
          while(m = line.match(bsb_chord_regex)) do
            chord = "[" + m[1] + "]"
            chord = "[]" if m[1] == "^" # blank chord to space empty lines
            offset = m.offset(1).first
            lines[i+1].insert(-1, " ") while lines[i+1].length < offset # make sure the line is long enough to position the chord
            lines[i+1].insert(offset, chord) # add songbase chord to words line
            line = line[0...offset] # chop chord off the end
          end
        elsif hymnal_regex_match = /\(Hymns, \#(\d+)/.match(line)
          hymnal_index = hymnal_regex_match[1]
        else
          # remove offset and add to chorded lines
          line = /([\s\d]\d?\s\s)?(.*)/.match(line)[2]

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

  desc "Create dutch book"
  task create_dutch_hymnal: :environment do
    hymnal = Book.find_or_create_by(name: "Liedboek", languages: ["nederlands"], slug: 'liedboek', sync_to_all: true)
    english_hymnal = Book.english_hymnal
    filename = Rails.root.join('db', 'hymns_data_DutchHymnalNumbers.csv')
    File.foreach(filename) do |line|
      puts line
      book_index, id = line.split(",").map(&:strip)
      song = Song.find(id)

      # Add to book
      hymnal.songs[song.id] = book_index

      # Add language link to other languages of that index
      english_hymn = english_hymnal.song_at(book_index)
      related_song_ids = english_hymn.language_links + [english_hymn.id]
      related_song_ids.each { |other_id| song.add_language_link(other_id) unless other_id == song.id}

      # Remove old hymnal ref comment
      song.update(lyrics: song.lyrics.sub(/(\n|\s)*Liedboek: #\d+/, ''))
    end
    hymnal.save!
  end

  desc "fix dutch book Liedboek comments"
  task fix_dutch_hymnal_comments: :environment do
    Book.dutch_hymnal.song_records.each do |song|
      puts song.id
      song.update(lyrics: song.lyrics.gsub(/(\n|\s)*Liedboek: #\d+/, ''))
    end
  end
end