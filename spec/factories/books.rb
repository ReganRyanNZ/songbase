FactoryGirl.define do
  factory :book do
    name "my songbook"

    after(:create) do |book|
      [nil, :accord_to_my_earnest, :abba_father].each { |song|
        FactoryGirl.create(:song, song, book: book)
      }
    end
  end

end