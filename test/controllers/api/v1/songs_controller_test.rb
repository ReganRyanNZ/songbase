require 'test_helper'

class SongsControllerTest < ActionDispatch::IntegrationTest
  test "GET #app_data" do

    deleted_song = FactoryBot.create(:song)

    time_of_fetch = js_time_now

    songs

    deleted_song.destroy_with_audit

    song_to_ignore = FactoryBot.create(:song)
    song_to_ignore.destroy_with_audit

    get api_v1_app_data_path, params: {updated_at: time_of_fetch}

    songs_response
    song_data = songs.map do |song|
      {
        title: song.title,
        lang: song.lang,
        lyrics: song.lyrics
      }
    end

    assert_response :success
    assert_equal [deleted_song.id], songs_response[:destroyed][:songs]
    assert_equal song_data, songs_response[:songs].map{|song| song.except(:id)}
  end

  test 'GET #admin_songs' do
    songs
    get api_v1_admin_songs_path

    assert_equal 2, songs_response[:songs][:changed].count

    song_data = {:title=>"Another song", :books=>{}, :lang=>"en", :references=>{}, :lyrics=>"Different words[G]", :edit_timestamp=>"less than a minute ago", :last_editor=>"System"}
    assert_equal song_data, songs_response[:songs][:changed].first.except(:id)
  end

  def songs_response
    @songs_response ||= JSON.parse(response.body, symbolize_names: true)
  end

  def songs
    @songs ||= [FactoryBot.create(:song), FactoryBot.create(:song, title: "Another song", lyrics: "Different words[G]")]
  end

  def js_time_now
    (Time.now.to_f*1000).to_i
  end
end
