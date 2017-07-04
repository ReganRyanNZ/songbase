class Song < ApplicationRecord
  has_many :books, through: :song_list

  def titles
    unique_titles ([
      strip_line(title),
      firstline,
      chorus_firstline
    ])
  end




  private
  def firstline
    strip_line(/^[^{#\r\n].*/.match(lyrics)[0])
  end

  def chorus_firstline
    return nil unless /{start_of_chorus}/.match(lyrics)
    strip_line(
                /{start_of_chorus}.*(\r|\n)+/m.match(lyrics)[0] # get the first chorus + rest of song
                .gsub( /{start_of_chorus} *(\r|\n)+/, "" ) # chop chorus tag off the start
                .gsub( /(\r|\n)+.*/m, "" ) # get only the first line
              )
  end

  def strip_line line
    # strip chords, newlines, trailing punctuation
    line.gsub( /\[[^\]]*\]/, "" ) # chords
        .gsub(/\n|\r/, "") # new lines
        .gsub(/[,;: .!]*\z/, "") # trailing punctuation
  end

  # gets unique strings from an array, ignoring case and punctuation
  def unique_titles titles
    titles.compact.uniq { |title| title.upcase.gsub(/[,;:.—-’!\''\""]/, "") }
  end

end
