namespace :parse do
  desc "Remove stanza numbers from all lyrics"
  task remove_stanza_numbers_from_lyrics: :environment do |args|
    Song.all.each do |s|
      cleaned_lyrics = ""
      s.lyrics.lines.each do |l|
        if /^(\d\d)(.*)/.match(l).nil?
          cleaned_lyrics += l
        else
          cleaned_lyrics +=  /^(\d\d)\s*(.*)/.match(l)[2] + "\n"
        end
      end

      unless s.lyrics == cleaned_lyrics
        s.lyrics = cleaned_lyrics
        s.save!
      end
    end
  end

  desc "Add static stanza numbers to lyrics"
  task add_stanza_numbers: :environment do |args|
    countableVerseRegex = /(^(?:\n*)|(?:\n\n))((?:(?:{ ?[Cc]omments?|#).*(?:\n)+)*)([^{#\n\s])/g
    Song.all.each do |song|



    end
  end

  desc "Convert old {comments: ...} to # ..."
  task convert_old_comments_to_new_format: :environment do |args|
    comments_regex = /{comments:(.*)}/
    Song.all.each do |song|
      if(song.lyrics[comments_regex])
        song.lyrics = song.lyrics.gsub(comments_regex) { '#' + $1 }
        song.save!
        puts song.firstline_title
      end
    end
  end
end