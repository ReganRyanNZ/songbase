class Api::V1::SongsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def all_songs
    render json: Song.all, status: 200
  end

  def songs
    time_in_seconds = (params[:updated_at].presence || 0) /1000
    client_updated_at = Time.at(time_in_seconds).utc
    render json: Song.where('updated_at > ?', client_updated_at).limit(3).map(&:app_entry), status: 200
  end

  private

  def song_params
    params.require(:song).permit(:firstline_title, :custom_title, :chorus_title, :lyrics, :lang)
  end

end