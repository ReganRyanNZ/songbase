# For optimal client-side data structure, and also to compact books down to a
# single row in the db per book, there are some unusual db fields in this
# model. Languages is stored as an array field, as one book could contain songs
# of more than one language. Songs are stored as a jsonb field. The format for
# this is {song_id => index_in_book, other_song_id => other_index_in_book}.

class Book < ApplicationRecord
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

  def song_records
    Song.where(id: songs.keys)
  end

  def app_entry
    {
      id: id,
      name: name,
      slug: slug,
      songs: songs,
      languages: languages
    }
  end
end
