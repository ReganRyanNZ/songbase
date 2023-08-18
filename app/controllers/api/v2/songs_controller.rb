class Api::V2::SongsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def app_data
    songs_to_sync = Song.where('updated_at > ?', client_updated_at).for_language(params[:language])
    books_to_sync = Book.where('updated_at > ?', client_updated_at).for_language(params[:language])

    render json: {
      songs: songs_to_sync.app_data,
      books: books_to_sync.app_data,
      destroyed: { songs: Song.deleted_after(client_updated_at).pluck(:id),
                   books: Book.deleted_after(client_updated_at).pluck(:id) },
      songCount: Song.for_language(params[:language]).count,
      data_updated_between: [client_updated_at, Time.now.utc]
    },
      status: 200
  end

  def languages
    render json: {
      languages: Song.distinct.pluck(:lang).without('english').prepend('english')
    }
  end

  def admin_songs
    raise "implement me!"
    # render json: {songs: {duplicates: duplicate_songs,
    #                       changed: recently_changed_songs - duplicate_songs,
    #                       unchanged: songs_for_admin - recently_changed_songs - duplicate_songs}}, status: 200
  end

  private

  # def duplicate_songs
  #   return [] unless super_admin

  #   @duplicate_songs ||= sort_songs(Song.search(params[:search])
  #                                       .duplicate_titles
  #                                       .includes(books: :song_books)
  #                                       .map(&:admin_entry))
  # end

  # def recently_changed_songs
  #   @recently_changed_songs ||= sort_songs(Song.search(params[:search])
  #                                              .recently_changed
  #                                              .includes(books: :song_books)
  #                                              .map(&:admin_entry))
  # end

  # def songs_for_admin
  #   sort_songs(Song.search(params[:search])
  #                  .includes(books: :song_books)
  #                  .limit(100)
  #                  .map(&:admin_entry))
  # end

  def client_updated_at
    return @client_updated_at if @client_updated_at.present?

    updated_at = params[:updated_at].presence&.to_i || 0
    seconds = updated_at / 1000
    milliseconds = updated_at % 1000
    @client_updated_at = Time.at(seconds, milliseconds, :millisecond).utc
  end

  # def sort_songs(songs)
  #   return songs unless songs.present?

  #   search = params[:search].downcase
  #   songs.sort_by do |s|
  #     title = clean_for_sorting(s[:title])
  #     [title.downcase.index(search) || 99, title]
  #   end
  # end

  # def clean_for_sorting(str)
  #   return '' unless str.present?

  #   str.gsub(/[’'",“\-—–!?()]/, "").upcase
  # end

end