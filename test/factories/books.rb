FactoryBot.define do
  factory :book do
    name { "my songbook" }
    slug { name.parameterize.underscore }
    lang { 'english' }
    trait :with_songs do
      after(:create) do |book|
        [nil, :accord_to_my_earnest, :abba_father].each { |song|
          FactoryBot.create(:song, song, books: [book])
        }
      end
    end
  end
end