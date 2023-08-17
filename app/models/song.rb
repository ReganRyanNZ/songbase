class Song < ApplicationRecord
  has_many :song_books, dependent: :destroy
  has_many :audits, dependent: :destroy
  validates :title, presence: true

  before_save :remove_windows_carriage_returns
  before_save :sanitize_lang

  default_scope -> { where(deleted_at: nil) }
  # We want to know songs that have been deleted since the client's last update
  # but if it was already _created_ (and then deleted) since the last update then we can completely ignore it.
  scope :deleted_after, ->(last_updated_at) { unscoped.where('deleted_at >= ?', last_updated_at).where('created_at < ?', last_updated_at) }

  scope :recently_changed, -> { where('updated_at >= ?', 1.week.ago).order(updated_at: :desc) }
  scope :duplicate_titles, -> {
    where(
      title: Song.select(:title)
        .group(:title) # group songs into buckets of the same title
        .having("count(*) > 1") # bucket has more than one song
        .select(:title) # get firstline from these buckets
    ).where("updated_at > ?", 3.months.ago) # old duplicates can be considered checked and ignored
  }
  scope :search, ->(search_term) {
    search_term ||= ''
    chord_or_non_char_or_newline_regex = "(?:(?:\\[[^\\]]*\\])|[.,?'\"!@#$%^&*();:-—]|\\n)*"
    wildcard_search = search_term.split('').join(chord_or_non_char_or_newline_regex)
    where("lyrics ~* ?", wildcard_search).or(where("title ~* ?", wildcard_search))
  }
  scope :for_language, ->(language) { language.present? ? where(lang: language) : all }

  # Many-to-many relationship, but stored in JSON in the db, so the query is a
  # bit different.
  # The ? in this means "any top-level key in the json data is equal to"
  def books
    Book.where("songs ? :id", id: self.id.to_s)
  end

  # TODO FIX ME FOR NEW STRUCTURE
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

  # TODO DOES THE TYPE EVER EQUAL BOOKS AND REFERENCES THIS SEEM SLIKE A BAD IDEA
  def app_entry(type=nil)
    case type
    when :books
      books.map(&:app_entry)
    when :references
      song_books.map(&:app_entry)
    else
      {
        id: id,
        title: title,
        lang: lang,
        lyrics: lyrics
      }
    end
  end

  def admin_entry
    {
      title: title,
      id: id,
      books: book_indices,
      lang: lang,
      references: book_indices,
      lyrics: lyrics,
      edit_timestamp: ApplicationController.helpers.time_ago_in_words(updated_at || created_at) + ' ago',
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

  # This gets duplicates including substrings and ignoring case and punctuation. It's very slow, so we can't
  # include it in normal admin pages
  def self.duplicate_songs
    all_songs = all.where(lang: 'english').pluck(:title, :id).each { |t| t[0] = t[0].downcase.gsub(/[,.'"?!:]/, '') }

    all_songs.select do |song|
      all_songs.any? do |potential_dup|
        song[0].match?(potential_dup[0]) && potential_dup[1] != song[1]
      end
    end.sort_by(&:first)
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

  def duplicate
    remove_windows_carriage_returns
    Song.find_by(lyrics: lyrics, title: title)
  end

  private

  def strip_line(line) # strip chords, newlines, trailing punctuation
    line.gsub( /\[[^\]]*\]/, "" ) # chords
        .gsub(/\n|\r/, "") # new lines
        .gsub(/\A[,;: .!]*/, "") # leading punctuation
        .gsub(/[,;: .!\-\—\–]*\z/, "") # trailing punctuation
  end

  def remove_windows_carriage_returns
    self.lyrics = self.lyrics.gsub(/[\r\u2028\u2029]/, "")
  end

  # TODO IS THIS USED ITS A BAD IDEA
  def book_indices
    self.song_books.map {|sb| [sb.book_id, sb.index] }.to_h
  end

  def sanitize_lang
    self.lang = self.lang.to_s.downcase
  end
end
