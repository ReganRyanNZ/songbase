class SongsController < ApplicationController
  before_action :set_song, only: [:show, :edit, :update, :destroy]
  before_action :authenticate, only: [:new, :edit, :create, :update, :destroy]
  before_action :check_maintenance
  before_action :adjust_lang_params, only: [:create, :update]

  # Preloaded data is to send the data directly with the html
  # Usually the client gets the data from our api
  # But by sending the data of the url the user is loading,
  # we can deliver the data instantly while the rest is
  # still loading via api.
  def app
    @book_slug = params[:book]
    @book_from_url = Book.find_by(slug: @book_slug) if @book_slug.present?
    if(params[:s].present? && params[:s] != 'i')

      # If a book's slug is in the url, then the id param will be the book's
      # index, so we need to convert it to the song's id:
      if @book_slug.present?
        @song_id = @book_from_url&.song_id_from_index(params[:s])
      end

      song = Song.find(@song_id || params[:s])
      if song.present?
        @title = song.title # sets page title in application.html.erb
        @song_id = params[:s]
        @preloaded_song = song.app_entry
        @preloaded_book_refs = Book.with_song(song).book_refs_for(song)
      end
    end
    render layout: "robot_visible"
  end

  def admin
  end

  def admin_example
    @song = Song.new(lyrics: example_lyrics)
  end

  def show
  end

  def print
    @song = Song.find(params[:s])
  end

  def new
    @song = Song.new
  end

  def edit
  end

  def create
    @song = Song.new(song_params)

    if @song.duplicate?
      redirect_to admin_path, notice: "Song was successfully created. #{song_flash_link(@song.duplicate)} to view in app."
    elsif @song.save
      Audit.create(user: current_user, song: @song, time: Time.zone.now)
      redirect_to admin_path, notice: "Song was successfully created. #{song_flash_link(@song)} to view in app."
    else
      render :new
    end
  end

  def update
    if @song.update(song_params)
      Audit.create(user: current_user, song: @song, time: Time.zone.now)
      redirect_to admin_path, notice: "Song was successfully updated. #{song_flash_link(@song)} to view in app."
    else
      render :edit
    end
  end

  def destroy
    if @song.destroy_with_audit(current_user)
      redirect_to admin_path, notice: 'Song was successfully destroyed.'
    else
      render :back
    end
  end

  private

  def song_flash_link(song)
    view_context.link_to 'Click here', song_path(song), class: 'flash_link'
  end

  def adjust_lang_params
    if params[:song][:lang] == "new_lang"
      params[:song][:lang] = params[:song][:new_lang]
    end
  end

  def set_song
    @song = Song.find(params[:id] || params[:s])
  end


  def song_params
    params.require(:song).permit(:lyrics, :title, :lang)
  end

  def example_lyrics
"
# This is a comment.

# If there is a comment for the recommended capo like the one below, users can tap it to transpose the chords.

# Capo 2

You can enter [C]chords in [Am]the ex[F]act place you want them [G]with squ[E7]are b[C]rackets like this.

  Chorus lines are
  made with
  2 spaces
  before each line

1
Stanza numbers go above the
First line of the stanza

2
For languages like spanish,
Where you want to merge the start and end
of a line. You can use_underscores to link words
like_this.

This example opened in a new tab. The song you were working on is still there in the previous tab.

Advanced:
- You can type '\\' (easy for physical keyboards) or '$' (easy for phone keyboards) to insert square brackets for adding chords quickly.
- You can type lowercase chords inside square brackets and they will be automatically capitalized."
  end
end
