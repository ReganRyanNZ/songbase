class Book < ApplicationRecord
  has_many :song_books, dependent: :destroy
  default_scope -> { where(deleted_at: nil) }

  scope :for_language, ->(language) { language.present? ? where(lang: language) : all }

  # Keeping this commented code as a reference for querying "does this
  # top-level key exist in this jsonb field", very useful:
  #
  # scope :with_song, ->(song) { Book.where("songs ? :id", id: '9') }

  # For now (17 Aug 2023) we will not delete books from db. If it's a problem
  # ~12 months from now we can try a "delete everything that hasn't been
  # updated for 6 months except the important books" kinda thing
  scope :deleted_after, ->(last_updated_at) { unscoped.where('deleted_at >= ?', last_updated_at).where('created_at < ?', last_updated_at) }

  def app_entry
    {
      id: id,
      name: name,
      lang: lang,
      slug: slug
    }
  end

  def app_entry_v2
    {
      id: id,
      name: name,
      lang: lang,
      slug: slug,
      songs: songs,
      languages: languages
    }
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
end
