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

  desc "Remove Windows Carriage Returns"
  task remove_windows_carriage_returns: :environment do |args|
    Song.all.each do |song|
      if(song.lyrics[/\r/])
        song.send :remove_windows_carriage_returns
        song.save!
        puts song.firstline_title
      end
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

  # NOTE must run convert_old_comments_to_new_format first
  desc "Add static stanza numbers to lyrics"
  task add_stanza_numbers: :environment do |args|
    countableVerseRegex = /(\A\n*|\n\n)((?:\#.*\n+)*)([^0-9\{\#\n\s])/
    Song.all.each do |song|
      lyrics = song.lyrics
      verse_number = 0
      lyrics = lyrics.gsub(countableVerseRegex) {verse_number += 1; $1 + ($2 || "") + verse_number.to_s + "\n" + $3}
      if verse_number > 2
        song.update(lyrics: lyrics)
        puts song.firstline_title
      end
    end
  end

  desc "Convert {start_of_chorus} and {end_of_chorus} blocks to new double space format"
  task convert_old_chorus_tags_to_new_format: :environment do |args|
    chorus_regex = /{start_of_chorus}.*\n((?:.|\n)*?)\n{end_of_chorus}/
    Song.all.each do |song|
      if(song.lyrics[chorus_regex])
        song.lyrics = song.lyrics.gsub(chorus_regex) { $1.gsub(/^/, "  ") }
        song.save!
        puts song.firstline_title
      end
    end
  end

  desc "Remove {no_number} tags"
  task remove_no_number_tags: :environment do |args|
    no_number_regex = /{no_number}\n/
    Song.all.each do |song|
      if(song.lyrics[no_number_regex])
        song.lyrics = song.lyrics.gsub(no_number_regex, "")
        song.save!
        puts song.firstline_title
      end
    end
  end
end