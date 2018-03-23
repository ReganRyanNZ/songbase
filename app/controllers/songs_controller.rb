class SongsController < ApplicationController
  before_action :set_song, only: [:show, :edit, :update, :destroy]
  before_action :authenticate, only: [:new, :edit, :create, :update, :destroy]
  before_action :check_maintenance
  before_action :adjust_lang_params, only: [:create, :update]

  def app
    set_songs
    @song_id = params[:s]
  end

  def admin
    set_songs(admin: true)
    set_songs_to_check
  end

  def show
  end

  def new
    @song = Song.new
  end

  def edit
  end

  def create
    @song = Song.new(song_params)

    respond_to do |format|
      if @song.save
        Audit.create(user: current_user, song: @song, time: Time.zone.now)
        format.html { redirect_to admin_path, notice: 'Song was successfully created.' }
        format.json { render :show, status: :created, location: @song }
      else
        format.html { render :new }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    if @song.update(song_params)
      Audit.create(user: current_user, song: @song, time: Time.zone.now)
      redirect_to admin_path, notice: 'Song was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    if @song.destroy
      redirect_to admin_path, notice: 'Song was successfully destroyed.'
    else
      render :back
    end
  end

  private

  def adjust_lang_params
    if params[:song][:lang] == "new_lang"
      params[:song][:lang] = params[:song][:new_lang]
    end
  end

  def set_songs_to_check
    @songs_to_check ||= {}
    @songs_to_check[:changed] = sort_songs(Song.recently_changed.map { |song| admin_song_entry(song.titles.values.first, song) })
    @songs_to_check[:duplicates] = sort_songs(Song.duplicates.map { |song| admin_song_entry(song.titles.values.first, song) }) if super_admin
  end

  def set_song
    @song = Song.find(params[:id] || params[:s])
  end

  def set_songs(admin: false)
    @songs = []
    Song.all.includes(books: :song_books).each do |song|
      song.titles.values.each do |title|
        @songs << (admin ? admin_song_entry(title, song) : song_entry(title, song))
      end
    end
    sort_songs(@songs)
  end

  def admin_song_entry(title, song)
    {
      title: title,
      id: song.id,
      books: song.book_indices,
      edit_timestamp: song.updated_at,
      last_editor: song.last_editor
    }
  end

  def song_entry(title, song)
    {
      id: song.id,
      title: title,
      lang: song.lang,
      books: song.book_indices,
      lyrics: song.lyrics
    }
  end

  def song_params
    params.require(:song).permit(:lyrics, :firstline_title, :custom_title, :chorus_title, :lang)
  end

  def sort_songs(songs)
    songs.sort_by! { |s| clean_for_sorting(s[:title]) }
  end
  def clean_for_sorting str
    str.gsub(/[’'",“\-—–!?()]/, "").upcase
  end
end
