class Song < ApplicationRecord
  has_many :song_books, dependent: :destroy
  has_many :books, through: :song_book
  has_many :audits, dependent: :destroy
  validate :titles_validation


  def guess_firstline_title
    strip_line(/^[^{#\r\n].*/.match(lyrics)[0])
  end

  def guess_chorus_title
    return nil unless /{start_of_chorus}/.match(lyrics)
    strip_line(
      /{start_of_chorus}.*(\r|\n)+/m.match(lyrics)[0] # get the first chorus + rest of song
      .gsub( /{start_of_chorus} *(\r|\n)+/, "" ) # chop chorus tag off the start
      .gsub( /(\r|\n)+.*/m, "" ) # get only the first line
    )
  end

  def titles
    {
      firstline_title: firstline_title,
      chorus_title: chorus_title,
      custom_title: custom_title
    }.reject { |k,v| v.blank? }
  end

  private

  def titles_validation
    unless titles.any?
      errors[:base] << "This song must have a title (or no one will find it!)"
    end
  end

  def strip_line line
    # strip chords, newlines, trailing punctuation
    line.gsub( /\[[^\]]*\]/, "" ) # chords
        .gsub(/\n|\r/, "") # new lines
        .gsub(/\A[,;: .!]*/, "") # leading punctuation
        .gsub(/[,;: .!]*\z/, "") # trailing punctuation
  end

  # gets unique strings from an array, ignoring case and punctuation
  # deprecated?
  def unique_titles titles
    titles.compact.uniq { |title| title.upcase.gsub(/[,;:.—-’!\''\""]/, "") }
  end

end
