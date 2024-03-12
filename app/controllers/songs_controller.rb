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

  def admin_example_with_tunes
    @song = Song.new(lyrics: example_lyrics_with_tunes)
    render :admin_example
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
    result = params.require(:song).permit(:lyrics, :title, :lang, language_links: [])
    result[:language_links] = result[:language_links].first.split(',') if result[:language_links].present?
    result
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

  def example_lyrics_with_tunes
"### Original tune
# You can see the example here for adding multiple tunes to the same song. This is a nice way to declutter songs with many tunes, and especially tunes where the wording changes (e.g. one tune with a chorus, one without)

# If you are adding a new tune, please also name the original tune, with the triple # format.

# Capo 1

1
Be [G]Thou su[D]preme, O [G]Jesus [C]Christ,
Nor [Am]creed, nor [D]form, nor [G]word,
Nor [D]holy [G]Church, nor [B7]human [Em]love,
Com[G]pare with [Am]Thee, [D]my [G]Lord!

2
Be Thou supreme, O Jesus Christ,
Thy love has conquered me;
Beneath Thy Cross I die to self,
And live alone to Thee.

3
Be Thou supreme, O Jesus Christ,
My inmost being fill;
So shall I think as Thou dost think,
And will as Thou dost will.

4
Be Thou supreme, O Jesus Christ,
Thy life transfigure mine;
And through this veil of mortal flesh,
Lord, let Thy splendor shine.

5
Be Thou supreme, O Jesus Christ,
My soul exults in Thee;
To be Thy slave, to do Thy will,
Is my felicity.

### New tune (with chorus)

1
[C]Be Thou su[G]preme, O [Am]Jesus Christ,
[F]Thy love has conquered [G]me;
[C]Beneath Thy [G]Cross I [Am]die to self,
[F]And live a[G]lone to [C]Thee.

  Be Thou su[F]prem[G]e, O Jesus [C]Christ,
  Nor creed, nor [F]for[G]m, nor [C]word,
  Nor holy [F]Church, [G]nor [Am]human love,
  [F]Compare with [G]Thee, my [C]Lord!

2
Be Thou supreme, O Jesus Christ,
My inmost being fill;
So shall I think as Thou dost think,
And will as Thou dost will.

3
Be Thou supreme, O Jesus Christ,
Thy life transfigure mine;
And through this veil of mortal flesh,
Lord, let Thy splendor shine.

4
Be Thou supreme, O Jesus Christ,
My soul exults in Thee;
To be Thy slave, to do Thy will,
Is my felicity.


# Verse 1 of the original hymn has
# become the chorus for this tune"
  end
end
