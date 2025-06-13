# For optimal client-side data structure, and also to compact books down to a
# single row in the db per book, there are some unusual db fields in this
# model.
# - Languages are stored as an array field, as one book could contain songs
#   of more than one language.
# - Songs are stored as a jsonb field. The format for
#   this is {song_id => index_in_book, other_song_id => other_index_in_book}.
#   Adding a song:  my_book.songs[song.id] = 1; my_book.save

class Book < ApplicationRecord
  before_validation :assign_default_owner,  on: [:create, :update]
  before_validation :generate_slug, on: [:create, :update]
  default_scope -> { where(deleted_at: nil) }

  # The weird syntax is for postgres Array types
  scope :for_language, ->(language) { language.present? ? where("? = ANY (languages)", language) : all }

  # Keeping this commented code as a reference for querying "does this
  # top-level key exist in this jsonb field", very useful:
  #
  scope :with_song, ->(song) { Book.where("songs ? ':id'", id: song.id) }


  # For now (17 Aug 2023) we will not delete books from db. If it's a problem
  # ~12 months from now we can try a "delete everything that hasn't been
  # updated for 6 months except the important books" kinda thing
  scope :deleted_after, ->(last_updated_at) { unscoped.where('deleted_at >= ?', last_updated_at).where('created_at < ?', last_updated_at) }

  def self.hymnals
    where(slug: ["spanish_hymnal", "english_hymnal", "german_hymnal", "french_hymnal", "hinos"])
  end

  def self.english_hymnal; find_by(slug: "english_hymnal"); end
  def self.spanish_hymnal; find_by(slug: "spanish_hymnal"); end
  def self.german_hymnal; find_by(slug: "german_hymnal"); end
  def self.french_hymnal; find_by(slug: "french_hymnal"); end
  def self.portuguese_hymnal; find_by(slug: "hinos"); end
  def self.dutch_hymnal; find_by(slug: "liedboek"); end
  def self.chinese_hymnal; find_by(slug: "chinese_hymnal"); end
  def self.korean_hymnal; find_by(slug: "korean_hymnal"); end

  def self.book_refs_for(song)
    all.map { |book| [book.slug, book.name, book.songs[song.id.to_s]] }
  end

  def self.find(param)
    if param =~ /[^0-9]/
      self.find_by(slug: param)
    else
      super
    end
  end

  def self.app_data
    self.all.map(&:app_entry)
  end

  def song_id_from_index(index)
    songs.key(index.to_s)
  end

  def song_at(index)
    id = song_id_from_index(index)
    Song.find(id) if id
  end

  def song_records
    Song.where(id: songs.keys)
  end

  def app_entry
    {
      id: id,
      name: name,
      slug: slug,
      songs: songs,
      languages: languages,
      owners: owners
    }
  end

  private 

  def assign_default_owner
      if owners.blank?
        self.owners = [{ name: User.system_user.name, email: User.system_user.email }]
      end
  end

  def generate_slug
    return if name.blank?

    if name_changed? || slug.blank?
      base_slug = name.parameterize(separator: '_')

      candidate = base_slug
      counter = 2
      while Book.exists?(slug: candidate) && (self.slug != candidate)
        candidate = "#{base_slug}_#{counter}"
        counter += 1
      end

      self.slug = candidate
    end
  end
end
