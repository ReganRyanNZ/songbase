class Song < ApplicationRecord
  has_many :audits, dependent: :destroy
  validates :title, presence: true

  before_save :remove_windows_carriage_returns
  before_save :sanitize_lang
  before_save :sanitize_title
  before_save :sanitize_lyrics
  after_save :reciprocate_language_links

  after_destroy :remove_references_from_books
  after_destroy :remove_language_links

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
    return number_search(search_term) if search_term.match?(/^\d+$/)

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

  def self.number_search(number)
    ids_from_hymnal_indexes = Book.hymnals.map { |book| book.songs.key(number) }.compact
    where(id: ids_from_hymnal_indexes)
  end

  def self.from_book(book, index)
    find(book.song_id_from_index(index.to_s))
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
    if old_song.has_chords? && !self.has_chords?
      lyrics = old_song.lyrics
    end

    # Remove comment with hymnal reference (obsolete now?)
    hymn_ref_regex = /.*[Hh]ymns.*[0-9]+\n+/
    lyrics = lyrics.gsub(hymn_ref_regex, "")
    self.update(lyrics: lyrics) if self.lyrics != lyrics

    old_song.destroy_with_audit(User.system_user)
  end

  # TODO test what happens (backend and frontend) when a linked record is destroyed
  def add_language_link other_song_id
    other_song_id = other_song_id.to_i
    self.language_links.push(other_song_id) unless self.language_links.include?(other_song_id)
    save
    other_song = Song.find(other_song_id)
    other_song.language_links.push(self.id) unless other_song.language_links.include?(self.id)
    other_song.save
  end

  def has_chords?
    lyrics.include?('[')
  end

  def app_entry
    {
      id: id,
      title: title,
      lang: lang,
      lyrics: lyrics,
      language_links: language_links
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

  def remove_language_links
    Song.where(id: language_links).each do |song|
      song.language_links -= [id]
      song.save
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

    verse_number_regex = /^\t(\d+)\s*\n(.*\n)?(.+)/
    tabbed_lines.gsub(verse_number_regex) { |m|
      captured_lines = m.split("\n")
      chorded_line = captured_lines[1].gsub(/\S/, '').length > captured_lines[1].gsub(/\s/, '').length
      if chorded_line
        [captured_lines[1], "#{captured_lines[0].strip}#{captured_lines[2]}"].join("\n")
      else
        "#{captured_lines[0].strip}#{captured_lines[1..-1].join("\n")}"
      end
    }
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
    self.lang = self.lang.to_s.strip.downcase
  end

  def sanitize_title
    self.title = self.title.strip.unicode_normalize(:nfd)
  end

  def sanitize_lyrics
    self.lyrics = lyrics.strip.unicode_normalize(:nfd)
    self.lyrics = "  #{lyrics}" if lyrics.split("\n")[1]&.match?(/  \S/) # put stripped leading spaces back if lyrics start with a chorus
  end

  # If we add or remove a link, we want to add/remove the mirrored link in the other record.
  # This is the downside of using an array db field instead of a join table.
  def reciprocate_language_links
    return unless saved_change_to_language_links?

    new_links = saved_change_to_language_links[1] - saved_change_to_language_links[0]
    removed_links = saved_change_to_language_links[0] - saved_change_to_language_links[1]

    if new_links.present?
      Song.where(id: new_links).each do |song|
        song.language_links << self.id
        song.language_links.uniq!
        song.save
      end
    end

    if removed_links.present?
      Song.where(id: removed_links).each do |song|
        song.language_links -= [self.id]
        song.save
      end
    end
  end
end
