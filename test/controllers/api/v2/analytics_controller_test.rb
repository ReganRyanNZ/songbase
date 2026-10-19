require 'test_helper'

class Api::V2::AnalyticsControllerTest < ActionDispatch::IntegrationTest
  test 'POST analytics records play counts' do
    song = FactoryBot.create(:song)

    post api_v2_analytics_path, params: { song_counts: { song.id => 3 } }, as: :json

    assert_response :ok
    record = SongAnalytic.find_by(date: Date.today)
    assert_equal 3, record.song_counts[song.id.to_s]
  end

  test 'POST analytics accumulates existing counts' do
    song = FactoryBot.create(:song)
    SongAnalytic.create!(date: Date.today, song_counts: { song.id.to_s => 2 })

    post api_v2_analytics_path, params: { song_counts: { song.id => 5 } }, as: :json

    assert_response :ok
    record = SongAnalytic.find_by(date: Date.today)
    assert_equal 7, record.song_counts[song.id.to_s]
  end

  test 'POST analytics returns error for invalid params' do
    post api_v2_analytics_path, params: { song_counts: "bad" }, as: :json

    assert_response :unprocessable_entity
  end

  test 'GET analytics summary returns top songs for superadmin' do
    song = FactoryBot.create(:song)
    SongAnalytic.create!(date: Date.today, song_counts: { song.id.to_s => 10 })

    get api_v2_analytics_path, as: :json

    assert_response :ok
    songs = response_json[:songs]
    assert_equal 1, songs.length
    assert_equal song.id, songs.first[:id]
    assert_equal 10, songs.first[:total_count]
  end

  test 'GET analytics summary returns forbidden for non-superadmin' do
    original_method = ApplicationController.instance_method(:super_admin)
    ApplicationController.define_method(:super_admin) { false }
    begin
      get api_v2_analytics_path, as: :json
      assert_response :forbidden
    ensure
      ApplicationController.define_method(:super_admin, original_method)
    end
  end

  private

  def response_json
    JSON.parse(response.body, symbolize_names: true)
  end
end
