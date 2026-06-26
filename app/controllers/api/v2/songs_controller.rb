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

  # Return a source book's songs with their book numbers, so the import modal can
  # render a searchable checklist. Ordered by book number.
  def book_songs
    book = Book.find_by(id: params[:book_id]) || Book.find_by(slug: params[:book_id])
    return render json: { error: "book not found" }, status: :not_found unless book

    records = book.song_records.index_by(&:id)
    songs = book.songs.map do |song_id, number|
      song = records[song_id.to_i]
      next unless song
      { number: number.to_i, id: song.id, title: song.title, lang: song.lang }
    end.compact.sort_by { |entry| entry[:number] }

    render json: { name: book.name, songs: songs }, status: :ok
  end

  # Resolve a pasted list of songs (by title, song id, or another book's index
  # numbers) into actual songs, so the book form can add them in bulk. Reads
  # only — the actual write happens via the existing books#create form submit.
  def custom_book_import
    mode = params[:mode].to_s
    text = params[:text].to_s

    all_lines = text.split(/[\n,]+/).map(&:strip).reject(&:blank?).uniq
    max_lines = 300
    truncated = all_lines.size > max_lines
    lines = all_lines.first(max_lines)

    matched, unmatched, ambiguous = [], [], []

    case mode
    when "ids"
      ints = lines.map(&:to_i).reject(&:zero?).uniq
      found = Song.where(id: ints).to_a
      found_ids = found.map(&:id)
      found.each { |song| matched << song.admin_entry }
      unmatched = lines.reject { |line| found_ids.include?(line.to_i) }
    when "numbers"
      source = Book.find_by(id: params[:source_book_id]) || Book.find_by(slug: params[:source_book_id])
      unless source
        render json: { error: "source book not found" }, status: :not_found and return
      end

      number_to_song_id = {}
      lines.each do |num|
        song_id = source.song_id_from_index(num)
        if song_id
          number_to_song_id[num] = song_id
        else
          unmatched << num
        end
      end
      songs_by_id = Song.where(id: number_to_song_id.values).index_by(&:id)
      number_to_song_id.each_value do |song_id|
        song = songs_by_id[song_id.to_i]
        matched << song.admin_entry if song
      end
    when "titles"
      lines.each { |line| resolve_title(line, matched, unmatched, ambiguous) }
    when "auto"
      # No mode toggle in the UI: per line, all-digits is treated as a song id,
      # anything else as a title.
      lines.each do |line|
        if line.match?(/\A\d+\z/)
          song = Song.find_by(id: line.to_i)
          song ? (matched << song.admin_entry) : (unmatched << line)
        else
          resolve_title(line, matched, unmatched, ambiguous)
        end
      end
    else
      render json: { error: "invalid mode" }, status: :unprocessable_entity and return
    end

    matched = matched.uniq { |entry| entry[:id] }

    render json: { matched: matched, unmatched: unmatched, ambiguous: ambiguous, truncated: truncated }, status: :ok
  end

  def record_analytics
    song_counts = params[:song_counts]
    unless song_counts.is_a?(ActionController::Parameters) || song_counts.is_a?(Hash)
      render json: { error: "invalid params" }, status: :unprocessable_entity and return
    end

    SongAnalytic.record!(song_counts.to_unsafe_h)

    render json: { ok: true }, status: :ok
  end

  def analytics_summary
    return render json: { error: "forbidden" }, status: :forbidden unless super_admin

    range = params[:range].presence || "all"
    language = params[:language].presence
    songs = SongAnalytic.summary(range: range, language: language)

    respond_to do |format|
      format.json { render json: { songs: songs }, status: :ok }
      format.csv do
        csv = "Rank,Title,Language,Views\n"
        songs.each_with_index { |s, i| csv += "#{i + 1},\"#{s[:title].gsub('"', '""')}\",#{s[:lang]},#{s[:total_count]}\n" }
        send_data csv, filename: "analytics-#{range}-#{Time.current.strftime('%Y%m%d')}.csv", type: "text/csv"
      end
    end
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

  # Resolve a single title line into a song, appending to matched/unmatched/
  # ambiguous. Exact (case-insensitive) match wins; otherwise a contains (ILIKE)
  # fallback; multiple matches are reported as ambiguous for the user to pick.
  def resolve_title(line, matched, unmatched, ambiguous)
    exact = Song.where("lower(title) = ?", line.downcase)
    if exact.count == 1
      matched << exact.first.admin_entry
    elsif exact.count > 1
      ambiguous << { line: line, matches: exact.map(&:admin_entry) }
    else
      partial = Song.where("title ILIKE ?", "%#{line}%").limit(10).to_a
      if partial.size == 1
        matched << partial.first.admin_entry
      elsif partial.size > 1
        ambiguous << { line: line, matches: partial.map(&:admin_entry) }
      else
        unmatched << line
      end
    end
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
