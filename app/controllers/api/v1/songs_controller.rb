class Api::V1::SongsController < ApplicationController
  skip_before_action :verify_authenticity_token

  # todo: ignore deleted records where the created_at is later than the client_updated_at
  # so e.g. a brand new user wouldn't need to download then delete a record.
  def app_data
    time_in_seconds = (params[:updated_at].presence&.to_i || 0) /1000
    client_updated_at = Time.at(time_in_seconds).utc
    render json: {
      songs: Song.where('updated_at > ?', client_updated_at).app_data,
      books: Book.where('updated_at > ?', client_updated_at).app_data,
      references: SongBook.where('updated_at > ?', client_updated_at).app_data,
      languages_info: Song.all.group_by(&:lang).map{ |lang,songs| [lang, songs.count] },
      destroyed:
        {
          songs: DeadSong.where('time > ?', client_updated_at).pluck(:song_id),
          references: SongBook.where('deleted_at > ?', client_updated_at).pluck(:id),
          books: Book.where('deleted_at > ?', client_updated_at).pluck(:id)
        }
      }, status: 200
  end
end
