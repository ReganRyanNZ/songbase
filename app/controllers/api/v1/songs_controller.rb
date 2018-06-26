class Api::V1::SongsController < ApplicationController

  def all_songs
    render json: Song.all, status: 200
  end

  private

  def song_params
    params.require(:song).permit(:firstline_title, :custom_title, :chorus_title, :lyrics, :lang)
  end

end