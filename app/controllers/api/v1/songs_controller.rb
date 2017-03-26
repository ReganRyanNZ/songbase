class Api::V1::SongsController < ApplicationController

  def all_songs
    render json: Song.all
  end

  def add_song
    song = Song.new(song_params)
    if song.save
      render json: song, status: 201, location: [:api, song]
    else
      render json: { errors: song.errors }, status: 422
    end
  end
end