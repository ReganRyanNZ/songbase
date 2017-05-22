class Song < ApplicationRecord
  has_many :books, through: :song_list
  def titles
    [
      title,
      firstline,
      chorus_firstline
    ].uniq.compact
  end

  private
  def firstline
    strip_line(/^[^{#].*/.match(lyrics)[0])
  end

  def chorus_firstline
    return nil unless /{start_of_chorus}/.match(lyrics)
    strip_line(
                /{start_of_chorus}.*\n\n/m.match(lyrics)[0] # get the first chorus + rest of song
                .gsub( /{start_of_chorus} *\n/, "" ) # chop chorus tag off the start
                .gsub( /\n.*/m, "" ) # get only the first line
              )
  end

  def strip_line line
    # strip chords, trailing punctuation, newlines
    line.gsub( /\[[^\]]*\]|\n|[,;: .]\z/, "" )
  end

end
