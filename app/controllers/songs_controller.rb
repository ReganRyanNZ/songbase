class SongsController < ApplicationController
  before_action :set_song, only: [:show, :edit, :update, :destroy]
  before_action :authenticate, only: [:new, :edit, :create, :update, :destroy, :analytics, :history, :trash, :restore, :cache, :reset_cache]
  before_action :require_super_admin, only: [:trash, :restore, :merge]
  before_action :check_maintenance
  before_action :adjust_lang_params, only: [:create, :update]

  layout "admin", only: [:admin, :analytics, :new, :edit, :create, :update, :history, :trash, :admin_example, :admin_example_with_tunes, :cache]

  # Preloaded data is to send the data directly with the html
  # Usually the client gets the data from our api
  # But by sending the data of the url the user is loading,
  # we can deliver the data instantly while the rest is
  # still loading via api.
  def app
    @show_books_page = request.path == '/books'
    @new_book_id = params[:add_book] if params[:add_book].present?
    Book.increment_counter(:downloads, @new_book_id) if @new_book_id && Book.exists?(@new_book_id)
    @new_book_token = params[:edit_token] if params[:edit_token].present?
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
        SongAnalytic.track_song_view(song.id)
        @title = song.title # sets page title in application.html.erb
        @song_id = params[:s]
        @preloaded_song = song.app_entry
        @preloaded_book_refs = Book.with_song(song).book_refs_for(song)
      end
    end
    render layout: "robot_visible"
  end

  def admin
    @songs = Song.search(params[:search] || '').limit(100)
  end

  def analytics
    redirect_to admin_path, alert: "Super admin only" unless super_admin
  end

  # Super-admin lever to force every client device to wipe its IndexedDB cache
  # and re-download on the next sync. Bumps a monotonic cache_version that the
  # client compares against its stored version (DatabaseSetupAndSync#checkCacheVersion).
  def cache
    redirect_to admin_path, alert: "Super admin only" and return unless super_admin
    @cache_version = AppSetting.cache_version
  end

  def reset_cache
    redirect_to admin_cache_path, alert: "Super admin only" and return unless super_admin
    @cache_version = AppSetting.bump_cache_version!
    redirect_to admin_cache_path, notice: "Cache bumped to version #{@cache_version}. All devices will re-download on their next sync."
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

  # Read-only edit history for a song (any signed-in editor).
  def history
    @song = Song.find(params[:id])
    @audits = @song.audits.includes(:user).order(time: :desc)
  end

  # Super-admin: trash page listing soft-deleted songs and books.
  def trash
    @deleted_songs = Song.deleted.order(deleted_at: :desc).map { |s|
      { id: s.id, title: s.title, lang: s.lang, deleted_at: s.deleted_at, deleted_by: User.find_by(id: s.deleted_by)&.name }
    }
    @deleted_books = Book.deleted.order(deleted_at: :desc).map { |b|
      { id: b.id, name: b.name, slug: b.slug, deleted_at: b.deleted_at }
    }
  end

  # Super-admin: restore a soft-deleted song.
  def restore
    song = Song.unscoped.find(params[:id])
    song.restore
    redirect_to admin_trash_path, notice: "Restored '#{song.title}'."
  end

  # Super-admin: merge another song into this one (the old song is absorbed —
  # book indices transferred, chorded lyrics kept, old song soft-deleted).
  def merge
    @song = Song.find(params[:id])
    old_song = Song.find(params[:old_id])
    @song.merge!(old_song)
    redirect_to edit_song_path(@song), notice: "Merged '#{old_song.title}' into '#{@song.title}'."
  end

  def create
    @song = Song.new(song_params)

    if @song.duplicate?
      redirect_to admin_path, notice: "Song was successfully created. #{song_flash_link(@song.duplicate)} to view in app."
    elsif @song.save
      email_diff_to_overseers(@song)
      Audit.log(
        song: @song,
        user: current_user,
        action: 'create',
        changes: format_changes_for_audit(@song.previous_changes.except(:updated_at, :created_at, :id))
      )
      redirect_to admin_path, notice: "Song was successfully created. #{song_flash_link(@song)} to view in app."
    else
      render :new
    end
  end

  def update
    @song = Song.find(params[:id])

    if @song.update(song_params)
      email_diff_to_overseers(@song)
      Audit.log(
        song: @song,
        user: current_user,
        action: 'update',
        changes: format_changes_for_audit(@song.previous_changes.except(:updated_at, :created_at, :id))
      )
      redirect_to admin_path, notice: "Song was successfully updated. #{song_flash_link(@song)} to view in app."
    else
      render :edit
    end
  end

  def destroy
    # Only super admins (or the creator, within 7 days) may delete a song.
    # This matches the gate on the Remove button in _form.html.erb.
    unless super_admin || @song.created_at > 7.days.ago
      redirect_to edit_song_path(@song), alert: "You can only delete songs within 7 days of creating them."
      return
    end

    if @song.destroy_with_audit(current_user)
      redirect_to admin_path, notice: 'Song was successfully destroyed.'
    else
      render :back
    end
  end

  private

  def email_diff_to_overseers(song)
    changes = song.previous_changes.except(:updated_at, :created_at, :id)
    SongMailer.song_changed(song, changes).deliver_later unless changes.empty?
  end

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
of a word, you can use_underscores to link words
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
