require 'rails_helper'

describe Api::V1::SongsController do
  # before(:each) { request.headers['Accept'] = "application/vnd.regan-ryan.v1" }

  describe "GET #all_songs" do
    before(:each) do
      @songs = [FactoryGirl.create(:song),
                FactoryGirl.create(:song, title: "Another song", lyrics: "Different words[G]")]
      get :all_songs, format: :json
    end

    it "returns all songs" do
      songs_response = JSON.parse(response.body, symbolize_names: true)
      expect(songs_response.to_json).to eql @songs.to_json
    end

    it "returns 200" do
      expect(response).to have_http_status(200)
    end
  end

  describe "POST #add_song" do
    it "adds song to db"
    it "returns 200"
  end

end