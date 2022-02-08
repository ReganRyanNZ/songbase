class Book < ApplicationRecord
  has_many :song_books, dependent: :destroy
  has_many :songs, through: :song_books
  scope :for_language, ->(language) { language.present? ? where(lang: language) : all }

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