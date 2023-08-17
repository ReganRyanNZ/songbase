require 'test_helper'

# This test is just a copy of v1's test.
# We need to test that the api now returns books with the song references in the book record

class SongsControllerTest < ActionDispatch::IntegrationTest
  # app_data:
  # - Returns a list of songs and books that have been updated (or destroyed)
  #   since the client last synced.
  # - Ignores records that were created then deleted again within the time gap
  test "GET #app_data" do
    song_to_delete = FactoryBot.create(:song) # created before client_last_updated_at, should not be in the list

    wait_a_tiny_bit
    client_last_updated_at = (Time.now.to_f*1000).to_i
    wait_a_tiny_bit

    new_songs = create_songs # created after client_last_updated_at, should be in the list

    song_to_delete.destroy_with_audit # deleted after client_last_updated_at, should be in the destroyed list

    song_to_ignore = FactoryBot.create(:song) # deleted but also created after last update should not appear in sync
    song_to_ignore.destroy_with_audit

    get api_v2_app_data_path, params: {updated_at: client_last_updated_at}

    song_data = new_songs.map do |song|
      {
        title: song.title,
        lang: song.lang,
        lyrics: song.lyrics
      }
    end

    assert_response :success
    assert_equal [song_to_delete.id], songs_response[:destroyed][:songs]
    assert_equal song_data, songs_response[:songs].map{|song| song.except(:id)}
  end

  test 'GET #app_data returns book data' do
    FactoryBot.create(:book, name: "Ignored")

    wait_a_tiny_bit
    client_last_updated_at = (Time.now.to_f*1000).to_i
    wait_a_tiny_bit

    song_1 = FactoryBot.create(:song, :accord_to_my_earnest)
    song_2 = FactoryBot.create(:song, :abba_father)

    FactoryBot.create(:book, songs: {song_1.id => "1", song_2.id => "2"}, name: "Kept")

    get api_v2_app_data_path, params: {updated_at: client_last_updated_at}

    assert_response :success
    assert_equal({song_1.id.to_s.to_sym=>"1", song_2.id.to_s.to_sym =>"2"}, songs_response[:books].first[:songs])
  end

  test 'GET #admin_songs' do

    skip("Needs to be revisited when api v2 is done")

    # create_songs
    # get api_v1_admin_songs_path, params: {search: ''}

    # assert_equal 2, songs_response[:songs][:changed].count

    # song_data = {:title=>"Another song", :books=>{}, :lang=>"en", :references=>{}, :lyrics=>"Different words[G]", :edit_timestamp=>"less than a minute ago", :last_editor=>"System"}
    # assert_equal song_data, songs_response[:songs][:changed].first.except(:id)
  end

  private

  def wait_a_tiny_bit
    sleep(0.001)
  end

  def songs_response
    @songs_response ||= JSON.parse(response.body, symbolize_names: true)
  end

  def create_songs
    @songs ||= [FactoryBot.create(:song), FactoryBot.create(:song, title: "Another song", lyrics: "Different words[G]")]
  end
end
