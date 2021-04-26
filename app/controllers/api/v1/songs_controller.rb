class Api::V1::SongsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def app_data
    time_in_seconds = (params[:updated_at].presence&.to_i || 0) /1000
    client_updated_at = Time.at(time_in_seconds).utc
    dead_songs = DeadSong.where('time > ?', client_updated_at).pluck(:song_id)
    render json: {
      songs: Song.where('updated_at > ?', client_updated_at).app_data,
      books: Book.where('updated_at > ?', client_updated_at).app_data,
      references: SongBook.where('updated_at > ?', client_updated_at).app_data,
      languages_info: Song.all.group_by(&:lang).map{ |lang,songs| [lang, songs.count] },
      destroyed:
        {
          songs: dead_songs,
          references: SongBook.where(song_id: dead_songs).pluck(:id),
          books: Book.where('deleted_at > ?', client_updated_at).pluck(:id)
        }
      }, status: 200
  end

  def admin_songs
    songs = {
      duplicates: super_admin ? sort_songs(Song.duplicates.includes(books: :song_books).map(&:admin_entry)) : [],
      changed: sort_songs(Song.recently_changed.includes(books: :song_books).map(&:admin_entry)),
      unchanged: sort_songs(Song.with_lyrics(params[:search]).includes(books: :song_books).limit(100).map(&:admin_entry))
    }
    render json: {songs: songs}, status: 200
  end

  private


  def sort_songs(songs)
    return songs unless songs.present?

    songs.sort_by { |s| clean_for_sorting(s[:title]) }
  end

  def clean_for_sorting(str)
    return '' unless str.present?

    str.gsub(/[’'",“\-—–!?()]/, "").upcase
  end

end