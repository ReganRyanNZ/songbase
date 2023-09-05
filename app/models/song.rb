class Song < ApplicationRecord
  has_many :audits, dependent: :destroy
  validates :title, presence: true

  before_save :remove_windows_carriage_returns
  before_save :sanitize_lang
  before_save :sanitize_title

  after_destroy :remove_references_from_books

  default_scope -> { where(deleted_at: nil) }
  # We want to know songs that have been deleted since the client's last update
  # but if it was already _created_ (and then deleted) since the last update then we can completely ignore it.
  scope :deleted_after, ->(last_updated_at) { unscoped.where('deleted_at >= ?', last_updated_at).where('created_at < ?', last_updated_at) }
  scope :recently_changed, -> { where('updated_at >= ?', 1.week.ago).order(updated_at: :desc) }

  scope :duplicate_titles, -> {
    where("(SELECT COUNT(*) FROM songs AS songs1
                            WHERE songs1.title LIKE (songs.title || '%')
                            AND songs1.deleted_at IS NULL) > 1")
  }

  scope :search, ->(search_term) {
    search_term ||= ''
    chord_regex = "(?:\\[[^\\]]*\\])"
    chord_or_non_char_or_newline_regex = "(?:#{chord_regex}|[[:punct:]]|[[:space:]])*"
    wildcard_search = search_term.gsub(/\s/, '')
                                 .split('')
                                 .join(chord_or_non_char_or_newline_regex)

    # ~* means case-insensitive regex matching
    where("title ~* ?", wildcard_search).or(where("lyrics ~* ?", wildcard_search))
  }
  scope :for_language, ->(language) { language.present? ? where(lang: language) : all }

  def self.languages
    distinct.pluck(:lang).map(&:downcase).sort.without('english').prepend('english')
  end

  # Many-to-many relationship, but stored in JSON in the db, so the query is a
  # bit different.
  # The ? in this means "any top-level key in the json data is equal to"
  def books
    Book.where("songs ? :id", id: self.id.to_s)
  end

  def merge!(old_song)
    # allow either Song or id as param
    old_song = Song.find(old_song) if old_song.class == Integer

    # keep indicies of old songs' books
    old_song.books.each do |book|
      songs = book.songs

      songs[self.id.to_s] = songs[old_song.id.to_s] # insert new song into book
      songs.delete(old_song.id.to_s) # remove old song from book

      book.update(songs: songs)
    end

    # choose the lyrics that has chords
    lyrics = self.lyrics
    has_chords = /\[/
    if old_song.lyrics =~ has_chords && !(lyrics =~ has_chords)
      lyrics = old_song.lyrics
    end

    # Remove comment with hymnal reference (obsolete now?)
    hymn_ref_regex = /.*[Hh]ymns.*[0-9]+\n+/
    lyrics = lyrics.gsub(hymn_ref_regex, "")
    self.update(lyrics: lyrics) if self.lyrics != lyrics

    old_song.destroy_with_audit(User.system_user)
  end

  def app_entry
    {
      id: id,
      title: title,
      lang: lang,
      lyrics: lyrics
    }
  end

  def admin_entry
    {
      title: title,
      id: id,
      lang: lang,
      lyrics: lyrics,
      edit_timestamp: ApplicationController.helpers.time_ago_in_words(updated_at || created_at) + ' ago',
      last_editor: last_editor || "System"
    }
  end

  def book_indices
    Book.with_song(self)
        .map { |book| [book.id, book.songs[id]] }
        .to_h
  end

  def destroy_with_audit(user=nil)
    user ||= User.system_user
    update(deleted_at: Time.current, deleted_by: user.id)
    remove_references_from_books
  end

  def remove_references_from_books
    Book.with_song(self).each do |book|
      book.update(songs: book.songs.except(self.id.to_s))
    end
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

  def duplicate?
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

  def sanitize_lang
    self.lang = self.lang.to_s.downcase
  end

  def sanitize_title
    self.title = self.title.strip
  end
end
