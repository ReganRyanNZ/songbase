class Api::V1::SongsController < ApplicationController

  def all_songs
    render json: Song.all, status: 200
  end

  def create
    song = Song.new(song_params)
    if song.save
      render json: song, status: 201
    else
      render json: { errors: song.errors }, status: 422
    end
  end

  private

  def song_params
    params.require(:song).permit(:firstline_title, :custom_title, :chorus_title, :lyrics, :lang)
  end

end