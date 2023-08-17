FactoryBot.define do
  factory :book do
    name { "my songbook" }
    slug { name.parameterize.underscore }
    lang { 'english' }
    trait :with_songs do
      songs {
        {
          FactoryBot.create(:song, :accord_to_my_earnest).id => '1',
          FactoryBot.create(:song, :abba_father).id => '2'
        }
      }
    end
  end
end