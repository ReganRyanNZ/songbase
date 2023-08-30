# DEPRECATED
# This version is no longer supported

class Api::V1::SongsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def app_data
    songs_to_sync = Song.where('updated_at > ?', client_updated_at).for_language(params[:language])
    books_to_sync = Book.where('updated_at > ?', client_updated_at).for_language(params[:language])
    render json: {
      deprecation_warning: 'WARNING: This api version is deprecated. Please use v2 instead, as v1 is no longer supported. Song data will still come through, but book data has been removed.',
      songs: songs_to_sync.app_data,
      books: [],
      references: [],
      destroyed: { songs: [],
                   references: [],
                   books: [] },
      songCount: Song.for_language(params[:language]).count,
      },
      status: 200
  end

  def languages
    render json: {
      deprecation_warning: 'WARNING: This api version is deprecated. Please use v2 instead, as v1 is no longer supported. Song data will still come through, but book data has been removed.',
      languages: Song.distinct.pluck(:lang).without('english').prepend('english')
    }
  end

  private

  def client_updated_at
    return @client_updated_at if @client_updated_at.present?

    updated_at = params[:updated_at].presence&.to_i || 0
    seconds = updated_at / 1000
    milliseconds = updated_at % 1000
    @client_updated_at = Time.at(seconds, milliseconds, :millisecond).utc
  end
end