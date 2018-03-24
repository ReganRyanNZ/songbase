class Song < ApplicationRecord
  has_many :song_books, dependent: :destroy
  has_many :books, through: :song_books
  has_many :audits, dependent: :destroy
  validate :titles_validation

  before_save :remove_windows_carriage_returns

  scope :recently_changed, -> { where('updated_at >= ?', 1.week.ago).order(updated_at: :desc) }
  scope :duplicates, -> {
    where(
      firstline_title: Song.select(:firstline_title)
        .group(:firstline_title) # group songs into buckets of the same title
        .having("count(*) > 1") # bucket has more than one song
        .select(:firstline_title) # get firstline from these buckets
    ).where("updated_at > ?", 3.months.ago) # old duplicates can be considered checked and ignored
  }

  def guess_firstline_title
    strip_line(/^[^#\r\n0-9].*/.match(lyrics)[0])
  end

  def guess_chorus_title
    chorus_title_regex = /^  ([^ ].*)/
    return nil unless chorus_title_regex.match(lyrics)
    strip_line(chorus_title_regex.match(lyrics)[1])
  end

  def titles
    {
      firstline_title: firstline_title,
      chorus_title: chorus_title,
      custom_title: custom_title
    }.reject { |k,v| v.blank? }
  end

  def book_indices
    self.song_books.map {|sb| [sb.book.name, sb.index] }.to_h
  end

  # keep indicies of old songs' books, then delete old song
  # merge from the one you want to keep the lyrics of
  def merge! old_song
    existing_books = self.books.map(&:id)
    old_song.song_books.each do |song_book|
      song_book.update(song_id: self.id) unless existing_books.include?(song_book.book_id)
    end
    # reload to refresh song_book associations
    old_song.reload.destroy
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
        .gsub(/[,;: .!\-\—\–]*\z/, "") # trailing punctuation
  end

  def remove_windows_carriage_returns
    self.lyrics = self.lyrics.gsub(/\r/, "")
  end
end
