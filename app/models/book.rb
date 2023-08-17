class Book < ApplicationRecord
  has_many :song_books, dependent: :destroy
  scope :for_language, ->(language) { language.present? ? where(lang: language) : all }

  # Keeping this commented code as a reference for querying "does this
  # top-level key exist in this jsonb field", very useful:
  #
  # scope :with_song, ->(song) { Book.where("songs ? :id", id: '9') }

  def app_entry
    {
      id: id,
      name: name,
      lang: lang,
      slug: slug
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
