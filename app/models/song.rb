class Song < ApplicationRecord
  has_many :books, through: :song_list
  store :titles, accessors: [:firstline, :chorus, :custom]

  # def titles
  #   unique_titles ([
  #     disabled_title ? nil : strip_line(title),
  #     disabled_firstline_title ? nil : firstline,
  #     disabled_chorus_title ? nil : chorus_firstline
  #   ])
  # end

  def guess_firstline
    strip_line(/^[^{#\r\n].*/.match(lyrics)[0])
  end

  def guess_chorus_firstline
    return nil unless /{start_of_chorus}/.match(lyrics)
    strip_line(
                /{start_of_chorus}.*(\r|\n)+/m.match(lyrics)[0] # get the first chorus + rest of song
                .gsub( /{start_of_chorus} *(\r|\n)+/, "" ) # chop chorus tag off the start
                .gsub( /(\r|\n)+.*/m, "" ) # get only the first line
              )
  end



  private

  def strip_line line
    # strip chords, newlines, trailing punctuation
    line.gsub( /\[[^\]]*\]/, "" ) # chords
        .gsub(/\n|\r/, "") # new lines
        .gsub(/[,;: .!]*\z/, "") # trailing punctuation
  end

  # gets unique strings from an array, ignoring case and punctuation
  # deprecated?
  def unique_titles titles
    titles.compact.uniq { |title| title.upcase.gsub(/[,;:.—-’!\''\""]/, "") }
  end

end
