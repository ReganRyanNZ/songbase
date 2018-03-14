class RemoveStanzaNumbersFromLyrics < ActiveRecord::Migration[5.0]
  def change
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
end
