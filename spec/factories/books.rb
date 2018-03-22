FactoryBot.define do
  factory :book do
    name "my songbook"

    after(:create) do |book|
      [nil, :accord_to_my_earnest, :abba_father].each { |song|
        FactoryBot.create(:song, song, books: [book])
      }
    end
  end

end