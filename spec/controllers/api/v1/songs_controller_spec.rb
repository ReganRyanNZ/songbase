require 'rails_helper'

describe Api::V1::SongsController do
  # before(:each) { request.headers['Accept'] = "application/vnd.regan-ryan.v1" }

  describe "GET #all_songs" do
    before(:each) do
      @songs = [FactoryGirl.create(:song),
                FactoryGirl.create(:song, firstline_title: "Another song", lyrics: "Different words[G]")]
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
    before(:each) do
      @song_attributes = FactoryGirl.attributes_for :song
      post :create, params: {song: @song_attributes}, format: :json
    end

    it "adds song to db" do
      song_response = JSON.parse(response.body, symbolize_names: true)
      expect(song_response[:lyrics]).to eql @song_attributes[:lyrics]
      expect(song_response[:firstline_title]).to eql @song_attributes[:firstline_title]
      expect(song_response[:lang]).to eql @song_attributes[:lang]
    end

    it "returns 201" do
      expect(response).to have_http_status(201)
    end
  end
end