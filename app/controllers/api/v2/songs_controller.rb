class Api::V2::SongsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def app_data
    songs_to_sync = Song.where('updated_at >= ?', client_updated_at).for_language(params[:language])

    # Build base query for books that were updated recently or match language
    books_base_query = Book.where('updated_at >= ?', client_updated_at).for_language(params[:language])

    # Add books explicitly requested via params[:books] — always include regardless of updated_at
    requested_book_ids = params[:books].present? ? params[:books].split(',').map(&:to_i) : []
    requested_books = Book.where(id: requested_book_ids)

    # Always include books with sync_to_all
    # Also include books where sync_to_all recently changed (so clients get the update to remove it)
    sync_to_all_books = books_base_query.where(sync_to_all: true)
    recently_changed_sync_to_all = books_base_query.where('sync_to_all_changed_at >= ?', client_updated_at)
    books_to_sync = requested_books.or(sync_to_all_books).or(recently_changed_sync_to_all)

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
    render json: { languages: Song.languages }
  end

  def admin_songs
    render json: {songs: {duplicates: duplicate_songs,
                          changed: recently_changed_songs - duplicate_songs,
                          unchanged: songs_for_admin - recently_changed_songs - duplicate_songs}}, status: 200
  end

  def custom_book_search
    render json: {songs: songs_for_language_links}, status: 200
  end

  def record_analytics
    song_counts = params[:song_counts]
    unless song_counts.is_a?(ActionController::Parameters) || song_counts.is_a?(Hash)
      render json: { error: "invalid params" }, status: :unprocessable_entity and return
    end

    today = Date.today
    record = SongAnalytic.find_or_initialize_by(date: today)
    counts = record.song_counts || {}
    song_counts.to_unsafe_h.each do |song_id, delta|
      next unless delta.is_a?(Integer) && delta > 0
      counts[song_id.to_s] = (counts[song_id.to_s] || 0) + delta
    end
    record.song_counts = counts
    record.save!

    render json: { ok: true }, status: :ok
  end

  def analytics_summary
    return render json: { error: "forbidden" }, status: :forbidden unless super_admin

    aggregated = {}
    SongAnalytic.find_each do |row|
      (row.song_counts || {}).each do |song_id, count|
        aggregated[song_id] = (aggregated[song_id] || 0) + count
      end
    end

    songs = aggregated
      .sort_by { |_id, total| -total }
      .first(100)
      .map do |song_id, total_count|
        song = Song.find_by(id: song_id)
        next unless song
        { id: song.id, title: song.title, lang: song.lang, total_count: total_count }
      end
      .compact

    render json: { songs: songs }, status: :ok
  end

  private

  def duplicate_songs
    # Only super admin can see duplicates, because it crashes performance
    return [] unless (super_admin && !params[:search].present?)

    recently_changed_ids = Song.recently_changed.pluck(:id) # only query recent songs to speed things up
    @duplicate_songs ||= sort_songs(Song.where(id: recently_changed_ids)
                                        .duplicate_titles
                                        .limit(10)
                                        .map(&:admin_entry))
  end

  def recently_changed_songs
    return [] if params[:search].present?

    @recently_changed_songs ||= sort_songs(Song.search(params[:search])
                                               .recently_changed
                                               .limit(50)
                                               .map(&:admin_entry))
  end

  def songs_for_admin
    sort_songs(Song.search(params[:search])
                   .limit(100)
                   .map(&:admin_entry))
  end

  def songs_for_language_links
    sort_songs(Song.search(params[:search])
                   .limit(20)
                   .map(&:admin_entry))
  end

  def client_updated_at
    return @client_updated_at if @client_updated_at.present?

    updated_at = params[:updated_at].presence&.to_i || 0
    seconds = updated_at / 1000
    milliseconds = updated_at % 1000
    @client_updated_at = Time.at(seconds, milliseconds, :millisecond).utc
  end

  def sort_songs(songs)
    return songs unless songs.present?

    search = clean_for_sorting(params[:search].to_s)
    songs.sort_by do |s|
      title = clean_for_sorting(s[:title])

      case
      when title.match?(/^#{search}/) # If search is the start of the title, top priority
        "0#{title}"
      when title.match?(search) # If title contains search, next priority
        "1#{title}"
      else
        "2#{title}" # Else just sort by title
      end
    end
  end

  def clean_for_sorting(str)
    return '' unless str.present?

    str.gsub(/[[:punct]]/, "").downcase
  end
end
