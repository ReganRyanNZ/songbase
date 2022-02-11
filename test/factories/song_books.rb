FactoryBot.define do
  factory :song_book do
    song
    book
    index { 123 }
  end
end