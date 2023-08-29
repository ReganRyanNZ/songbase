require 'test_helper'

# This test is just a copy of v1's test.
# We need to test that the api now returns books with the song references in the book record

class SongsControllerTest < ActionDispatch::IntegrationTest
  test 'app_data returns song data according to the last sync timestamp vs songs updated_at timestamp' do
    song_to_delete = FactoryBot.create(:song) # created before client_last_updated_at, should not be in the list

    wait_a_tiny_bit
    client_last_updated_at = (Time.now.to_f*1000).to_i
    wait_a_tiny_bit

    new_songs = create_songs # created after client_last_updated_at, should be in the list

    song_to_delete.destroy_with_audit # deleted after client_last_updated_at, should be in the destroyed list

    song_to_ignore = FactoryBot.create(:song) # deleted but also created after last update should not appear in sync
    song_to_ignore.destroy_with_audit

    get api_v2_app_data_path, params: {updated_at: client_last_updated_at}

    expected_song_data = new_songs.map do |song|
      {
        title: song.title,
        lang: song.lang,
        lyrics: song.lyrics
      }
    end

    assert_response :success
    response_data = response_json
    assert_equal [song_to_delete.id], response_data[:destroyed][:songs]
    assert_equal expected_song_data, response_data[:songs].map{|song| song.except(:id)}
  end

  test 'app_data returns book data' do
    FactoryBot.create(:book, name: "Ignored")

    wait_a_tiny_bit
    client_last_updated_at = (Time.now.to_f*1000).to_i
    wait_a_tiny_bit

    song_1 = FactoryBot.create(:song, :accord_to_my_earnest)
    song_2 = FactoryBot.create(:song, :abba_father)

    FactoryBot.create(:book, songs: {song_1.id => "1", song_2.id => "2"}, name: "Kept")

    get api_v2_app_data_path, params: {updated_at: client_last_updated_at}

    expected_book_data = {name: "Kept",
                          slug: "kept",
                          songs: {song_1.id.to_s.to_sym=>"1", song_2.id.to_s.to_sym =>"2"},
                          languages: ["english"]}
    assert_response :success
    assert_equal(expected_book_data, response_json[:books].first.except(:id))

    wait_a_tiny_bit
    client_last_updated_at = (Time.now.to_f*1000).to_i
    wait_a_tiny_bit

    # Already updated, wont send the data again:
    get api_v2_app_data_path, params: {updated_at: client_last_updated_at}
    assert_response :success
    assert_equal([], response_json[:books])
  end

  test 'languages returns a list of distinct languages' do
    FactoryBot.create(:song, :accord_to_my_earnest, lang: 'english')
    FactoryBot.create(:song, :abba_father, lang: 'english')
    FactoryBot.create(:song, :portuguese, lang: 'portuguese')

    get api_v2_languages_path
    assert_equal ['english', 'portuguese'], response_json[:languages]
  end

  test 'admin_songs' do
    create_songs
    get api_v2_admin_songs_path, params: {search: ''}

    assert_equal 2, response_json[:songs][:changed].count

    song_data = {:title=>"Another song", :lang=>"english", :lyrics=>"Different words[G]", :edit_timestamp=>"less than a minute ago", :last_editor=>"System"}
    assert_equal song_data, response_json[:songs][:changed].first.except(:id)
  end

  private

  def wait_a_tiny_bit
    travel 1.second
  end

  def response_json
    JSON.parse(response.body, symbolize_names: true)
  end

  def create_songs
    @songs ||= [FactoryBot.create(:song), FactoryBot.create(:song, title: "Another song", lyrics: "Different words[G]")]
  end
end
