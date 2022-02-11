class Song < ApplicationRecord
  has_many :song_books, dependent: :destroy
  has_many :books, through: :song_books
  has_many :audits, dependent: :destroy
  validate :titles_validation

  before_save :remove_windows_carriage_returns

  default_scope -> { where(deleted_at: nil) }
  # We want to know songs that have been deleted since the client's last update
  # but if it was already _created_ (and then deleted) since the last update then we can completely ignore it.
  scope :deleted_after, ->(last_updated_at) { unscoped.where('deleted_at > ?', last_updated_at).where('created_at < ?', last_updated_at) }

  scope :recently_changed, -> { where('updated_at >= ?', 1.week.ago).order(updated_at: :desc) }
  scope :duplicates, -> {
    where(
      firstline_title: Song.select(:firstline_title)
        .group(:firstline_title) # group songs into buckets of the same title
        .having("count(*) > 1") # bucket has more than one song
        .select(:firstline_title) # get firstline from these buckets
    ).where("updated_at > ?", 3.months.ago) # old duplicates can be considered checked and ignored
  }
  scope :with_lyrics, ->(search='') {
    chord_or_non_char_or_newline_regex = "(?:(?:\\[[^\\]]*\\])|[.,?'\"!@#$%^&*();:-—]|\\n)*"
    wildcard_search = search.split('').join(chord_or_non_char_or_newline_regex)
    matches = where("lyrics ~* ?", wildcard_search)
  }
  scope :for_language, ->(language) { language.present? ? where(lang: language) : all }

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
    self.song_books.map {|sb| [sb.book_id, sb.index] }.to_h
  end

  def merge! old_song
    # allow either Song or id as param
    old_song = Song.find(old_song) if old_song.class == Integer

    # keep indicies of old songs' books
    existing_books = self.books.map(&:id)
    old_song.song_books.each do |song_book|
      song_book.update(song_id: self.id) unless existing_books.include?(song_book.book_id)
    end

    # choose the lyrics that has chords
    if old_song.lyrics =~ /\[/ && !(self.lyrics =~ /\[/)
      self.update(lyrics: old_song.lyrics)
    end

    hymn_ref_regex = /.*[Hh]ymns.*[0-9]+\n+/

    self.update(lyrics: self.lyrics.gsub(hymn_ref_regex, "")) if self.lyrics =~ hymn_ref_regex

    # reload to refresh song_book associations
    old_song.reload.destroy_with_audit(User.system_user)
  end

  def app_entry(type=nil)
    case type
    when :books
      books.map(&:app_entry)
    when :references
      song_books.map(&:app_entry)
    else
      {
        id: id,
        title: titles.first[1],
        lang: lang,
        lyrics: lyrics
      }
    end
  end

  def admin_entry
    {
      title: firstline_title,
      id: id,
      books: book_indices,
      lang: lang,
      references: book_indices,
      lyrics: lyrics,
      edit_timestamp: (updated_at || created_at).to_s + " ago",
      last_editor: last_editor || "System"
    }
  end

  def destroy_with_audit(user=nil)
    user ||= User.system_user
    update(deleted_at: Time.current, deleted_by: user.id)
  end

  def self.app_data
    all.map(&:app_entry)
  end

  def print_format
    chord_chars = /\[.*?\]/
    not_chord_chars = /(^\s*|\])[^\[]*\[?/
    start_of_chorus = /(^|\n)  /
    lines = lyrics.gsub(start_of_chorus, '\1' + "\t").split("\n")

    tabbed_lines = "\t" + lines.map do |line|
      if line['[']
        words = line.split(chord_chars).join('')
        chords = line.gsub(not_chord_chars) { |match| " " * match.length }
        is_chorus_line = line[/^\t/]
        if is_chorus_line
          chords = "\t" + chords
        end
        line = [chords, words]
      end
      line
    end.join("\n\t")
    verse_number_regex = /^\t(\d+)\s*\n/
    tabbed_lines.gsub(verse_number_regex, '\1')
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
    self.lyrics = self.lyrics.gsub(/[\r\u2028\u2029]/, "")
  end
end
