require 'test_helper'

class Api::V2::CustomBookImportTest < ActionDispatch::IntegrationTest
  test 'ids mode matches existing songs and reports missing ones' do
    s1 = FactoryBot.create(:song, :abba_father)
    s2 = FactoryBot.create(:song, :accord_to_my_earnest)

    post api_v2_custom_book_import_path,
         params: { mode: 'ids', text: "#{s1.id}\n#{s2.id}, 999999" },
         as: :json

    assert_response :ok
    matched_ids = response_json[:matched].map { |s| s[:id] }
    assert_includes matched_ids, s1.id
    assert_includes matched_ids, s2.id
    assert_includes response_json[:unmatched].map(&:to_s), '999999'
  end

  test 'numbers mode resolves via the source book index' do
    s1 = FactoryBot.create(:song, :abba_father)
    s2 = FactoryBot.create(:song, :accord_to_my_earnest)
    source = FactoryBot.create(:book, name: 'Source', songs: { s1.id => '5', s2.id => '12' })

    post api_v2_custom_book_import_path,
         params: { mode: 'numbers', source_book_id: source.id, text: "5\n12\n99" },
         as: :json

    assert_response :ok
    assert_equal [s1.id, s2.id].sort, response_json[:matched].map { |s| s[:id] }.sort
    assert_includes response_json[:unmatched], '99'
  end

  test 'numbers mode 404s when the source book is missing' do
    post api_v2_custom_book_import_path,
         params: { mode: 'numbers', source_book_id: 999_999, text: '1' },
         as: :json
    assert_response :not_found
  end

  test 'titles mode matches on an exact title' do
    song = FactoryBot.create(:song, :abba_father) # title "Abba, Father"

    post api_v2_custom_book_import_path,
         params: { mode: 'titles', text: 'Abba, Father' }, as: :json

    assert_response :ok
    assert_equal [song.id], response_json[:matched].map { |s| s[:id] }
    assert_empty response_json[:ambiguous]
    assert_empty response_json[:unmatched]
  end

  test 'titles mode reports ambiguity when multiple exact matches exist' do
    FactoryBot.create(:song, title: 'Same Title')
    FactoryBot.create(:song, title: 'Same Title')

    post api_v2_custom_book_import_path,
         params: { mode: 'titles', text: 'Same Title' }, as: :json

    assert_response :ok
    assert_empty response_json[:matched]
    assert_equal 1, response_json[:ambiguous].length
    assert_equal 2, response_json[:ambiguous].first[:matches].length
  end

  test 'titles mode reports unmatched when nothing matches' do
    post api_v2_custom_book_import_path,
         params: { mode: 'titles', text: 'A totally nonexistent song title xyzzy' },
         as: :json

    assert_response :ok
    assert_empty response_json[:matched]
    assert_empty response_json[:ambiguous]
    assert_equal ['A totally nonexistent song title xyzzy'], response_json[:unmatched]
  end

  test 'caps input at 300 unique lines and flags truncation' do
    text = (1..301).map { |i| 1_000_000 + i }.join("\n")

    post api_v2_custom_book_import_path,
         params: { mode: 'ids', text: text }, as: :json

    assert_response :ok
    data = response_json
    assert_equal true, data[:truncated]
    assert_equal 300, data[:unmatched].length
    assert_empty data[:matched]
  end

  test 'invalid mode returns 422' do
    post api_v2_custom_book_import_path,
         params: { mode: 'bogus', text: 'x' }, as: :json
    assert_response :unprocessable_entity
  end

  test 'auto mode treats digit lines as ids and other lines as titles' do
    by_title = FactoryBot.create(:song, :abba_father)         # "Abba, Father"
    by_id = FactoryBot.create(:song, :accord_to_my_earnest)

    post api_v2_custom_book_import_path,
         params: { mode: 'auto', text: "#{by_id.id}\nAbba, Father\nNope nope nope" },
         as: :json

    assert_response :ok
    data = response_json
    matched_ids = data[:matched].map { |s| s[:id] }
    assert_includes matched_ids, by_id.id        # digit line resolved as a song id
    assert_includes matched_ids, by_title.id     # text line resolved as a title
    assert_equal ['Nope nope nope'], data[:unmatched]
  end

  test 'book_songs returns a book songs ordered by book number' do
    s1 = FactoryBot.create(:song, :abba_father)
    s2 = FactoryBot.create(:song, :accord_to_my_earnest)
    book = FactoryBot.create(:book, name: 'Source', songs: { s1.id => '3', s2.id => '1' })

    get api_v2_book_songs_path, params: { book_id: book.id }

    assert_response :ok
    data = response_json
    assert_equal 'Source', data[:name]
    assert_equal [1, 3], data[:songs].map { |s| s[:number] }
    assert_equal [s2.id, s1.id], data[:songs].map { |s| s[:id] }
    assert_equal 'Abba, Father', data[:songs].second[:title]
  end

  test 'book_songs 404s for a missing book' do
    get api_v2_book_songs_path, params: { book_id: 999_999 }
    assert_response :not_found
  end

  private

  def response_json
    JSON.parse(response.body, symbolize_names: true)
  end
end
