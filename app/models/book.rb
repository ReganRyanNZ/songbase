class Book < ApplicationRecord
  has_many :song_books, dependent: :destroy
  has_many :songs, through: :song_books

  def self.find(param)
    if param =~ /[^0-9]/
      self.find_by(slug: param)
    else
      super
    end
  end

  def self.reactify
    hash = {}
    self.all.each do |book|
      hash[book.id] = {
        name: book.name,
        lang: book.lang,
        slug: book.slug
      }
    end
    hash
  end
end