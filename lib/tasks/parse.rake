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
end