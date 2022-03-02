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
    if(params[:s] =~ /\d+/)
      if @book_slug.present?
        @ref = SongBook
          .joins(:book)
          .where(books: {slug: @book_slug}, index: params[:s])
          .first
      end
      song = Song.find(@ref&.song_id || params[:s])
      if song.present?
        @title = song.title
        @song_id = song.id
        @preloaded_song = song.app_entry
        @preloaded_current_book = Book.find_by(slug: @book_slug)&.app_entry
        @preloaded_books = song.app_entry(:books)
        @preloaded_references = song.app_entry(:references)
      end
    end
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

    respond_to do |format|
      if @song.save
        Audit.create(user: current_user, song: @song, time: Time.zone.now)
        format.html { redirect_to admin_path, notice: "Song was successfully created. #{view_context.link_to 'Click here', song_path(@song), class: 'flash_link'} to view in app." }
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
      redirect_to admin_path, notice: "Song was successfully updated. #{view_context.link_to 'Click here', song_path(@song), class: 'flash_link'} to view in app."
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
of a line. You can use_ underscores to link words
like_ this.

This example opened in a new tab. The song you were working on is still there in the previous tab.
"
  end
end
