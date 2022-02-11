class Api::V1::SongsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def app_data
    songs_to_sync = Song.where('updated_at > ?', client_updated_at).for_language(params[:language])
    books_to_sync = Book.where('updated_at > ?', client_updated_at).for_language(params[:language])
    references_to_sync = SongBook.where('updated_at > ?', client_updated_at).for_books(books_to_sync)
    render json: {
      songs: songs_to_sync.app_data,
      books: books_to_sync.app_data,
      references: references_to_sync.app_data,
      destroyed: { songs: dead_songs,
                   references: SongBook.where(song_id: dead_songs).pluck(:id),
                   books: Book.where('deleted_at > ?', client_updated_at).pluck(:id) },
      songCount: Song.for_language(params[:language]).count,
      },
      status: 200
  end

  def languages
    render json: {
      languages: Song.distinct.pluck(:lang).without('english').prepend('english')
    }
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

  def client_updated_at
    return @client_updated_at ||= Time.at((params[:updated_at].presence&.to_i || 0) / 1000).utc
  end

  def dead_songs
    @dead_songs ||= Song.deleted_after(client_updated_at).pluck(:id)
  end

  def sort_songs(songs)
    return songs unless songs.present?

    songs.sort_by { |s| clean_for_sorting(s[:title]) }
  end

  def clean_for_sorting(str)
    return '' unless str.present?

    str.gsub(/[’'",“\-—–!?()]/, "").upcase
  end

end