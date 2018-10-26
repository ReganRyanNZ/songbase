class Api::V1::SongsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def app_data
    time_in_seconds = (params[:updated_at].presence&.to_i || 0) /1000
    client_updated_at = Time.at(time_in_seconds).utc
    render json: {
      songs: Song.where('updated_at > ?', client_updated_at).app_data,
      books: Book.where('updated_at > ?', client_updated_at).app_data,
      references: SongBook.where('updated_at > ?', client_updated_at).app_data,
      languages_info: Song.all.group_by(&:lang).map{ |lang,songs| [lang, songs.count] },
      current_ids:
        {
          songs: Song.pluck(:id),
          books: Book.pluck(:id),
          references: SongBook.pluck(:id)
        }
      }, status: 200
  end
end