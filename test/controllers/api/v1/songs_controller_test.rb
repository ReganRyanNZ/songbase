require 'test_helper'

class SongsControllerTest < ActionDispatch::IntegrationTest
  test "GET #app_data" do
    song_to_delete = FactoryBot.create(:song) # created before client_last_updated_at, should not be in the list

    wait_a_tiny_bit
    client_last_updated_at = (Time.now.to_f*1000).to_i
    wait_a_tiny_bit

    new_songs = create_songs # created after client_last_updated_at, should be in the list

    song_to_delete.destroy_with_audit # deleted after client_last_updated_at, should be in the destroyed list

    song_to_ignore = FactoryBot.create(:song) # deleted but also created after last update should not appear in sync
    song_to_ignore.destroy_with_audit

    get api_v1_app_data_path, params: {updated_at: client_last_updated_at}

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

  test 'GET #admin_songs' do

    skip("Needs to be revisited when api v2 is done")

    create_songs
    get api_v1_admin_songs_path, params: {search: ''}

    assert_equal 2, songs_response[:songs][:changed].count

    song_data = {:title=>"Another song", :books=>{}, :lang=>"en", :references=>{}, :lyrics=>"Different words[G]", :edit_timestamp=>"less than a minute ago", :last_editor=>"System"}
    assert_equal song_data, songs_response[:songs][:changed].first.except(:id)
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
