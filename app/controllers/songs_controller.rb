class SongsController < ApplicationController
  before_action :set_song, only: [:show, :edit, :update, :destroy]
  before_action :set_songs, only: [:app, :admin]
  before_action :authenticate, only: [:new, :edit, :create, :update, :destroy]
  before_action :check_maintenance

  def app
    @song_id = params[:s]
  end

  def admin
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
        format.html { redirect_to @song, notice: 'Song was successfully created.' }
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
      redirect_to @song, notice: 'Song was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    if @song.destroy
      redirect_to admin_url, notice: 'Song was successfully destroyed.'
    else
      render :back
    end
  end

  private

  def set_song
    @song = Song.find(params[:id])
  end

  def set_songs

    @songs = []
    Song.all.each do |song|
      song.titles.each do |t|
        @songs << {title: t[1], model: song}
      end
    end
    @songs.sort_by! { |s| clean_for_sorting(s[:title]) }
  end

  def song_params
    params.require(:song).permit(:lyrics, :firstline_title, :custom_title, :chorus_title, :lang)
  end

  def clean_for_sorting str
    str.gsub(/[’'",“\-—–!?()]/, "").upcase
  end
end
