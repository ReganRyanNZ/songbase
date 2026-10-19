# Super-admin email previews: renders the real mailer templates with sample
# data so the emails can be eyeballed and tweaked without sending anything.
# Sample records are built in memory and never saved; the changes hashes are
# built the same way SongsController#email_diff_to_overseers builds them, so
# the previews match what production actually sends.
class EmailPreviewsController < ApplicationController
  before_action :authenticate
  before_action :require_super_admin

  layout "admin"

  def index
    @previews = PREVIEWS
  end

  def show
    @preview = PREVIEWS.find { |preview| preview[:id] == params[:id] }
    if @preview.nil?
      redirect_to admin_preview_emails_path, alert: "Unknown email preview."
      return
    end

    message = @preview[:build].call
    @html_part = extract_part(message, "text/html")
    @text_part = extract_part(message, "text/plain")
    @meta = { from: message[:from].to_s, to: message[:to].to_s, subject: message.subject }
    @part = params[:part] == "text" && @text_part.present? ? "text" : "html"
    @mobile = params[:width] == "mobile"
  end

  private

  def extract_part(message, mime_type)
    if message.multipart?
      message.parts.find { |part| part.mime_type == mime_type }&.body&.decoded
    elsif message.mime_type == mime_type
      message.body.decoded
    end
  end

  # Each entry generates a Mail::Message exactly as its production call site does.
  PREVIEWS = [
    {
      id: "book-created",
      name: "BookMailer — book_created",
      description: "Sent when a book is created with a contact email. Carries the read-only and edit-access share links.",
      build: -> { BookMailer.book_created(preview_book) }
    },
    {
      id: "book-created-admin",
      name: "BookMailer — book_created_admin",
      description: "Sent to the admins on every book creation — who created it, what's in it, and where to manage it.",
      build: -> { BookMailer.book_created_admin(preview_book) }
    },
    {
      id: "song-changed-new",
      name: "SongMailer — song_changed (new song)",
      description: "Sent to the language overseers (or the support address for unlisted languages) when a new song is created. All lines are green since there is no old version.",
      build: -> {
        song, changes = preview_new_song
        SongMailer.song_changed(song, changes, "Jethro Read")
      }
    },
    {
      id: "song-changed-update",
      name: "SongMailer — song_changed (update)",
      description: "Sent when a song is updated. Removed lines are red, added lines green, unchanged lines grey.",
      build: -> {
        song, changes = preview_updated_song
        SongMailer.song_changed(song, changes, "Jethro Read")
      }
    }
  ].freeze

  def self.preview_book
    Book.new(
      name: "Camp Weekend 2026",
      email: "songbase.brothers@gmail.com",
      languages: ["english"]
    ).tap do |book|
      book.id = 314
      book.share_code = "camp-w-48392"
      book.edit_token = "4f8a1c6b0e3d9527a1f0c8b4d6e2a9f3"
    end
  end

  def self.preview_new_song
    song = Song.new(lang: "english")
    song.id = 321
    song.title = "Be Thou Supreme"
    song.lyrics = <<~LYRICS
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
    LYRICS
    # After a real create, previous_changes includes the new id — the mailer
    # reads id_previously_changed? to pick the "New Song" subject.
    song.define_singleton_method(:id_previously_changed?) { true }
    [song, song.changes.except(:updated_at, :created_at, :id)]
  end

  # NOTE: the changes hash is built explicitly rather than via dirty tracking
  # (song.lyrics = new). Assignments on a new record diff against the pristine
  # default, so a staged "old" value in Song.new(...) never shows up — the
  # diff would render everything as added. This mirrors the shape of
  # previous_changes that the production call site passes.
  def self.preview_updated_song
    song = Song.new(lang: "español", title: "Sé Tú Supremo")
    song.id = 322
    old_lyrics = <<~LYRICS
      # Capo 2

      1
      [G]Sé Tú su[D]preme, oh [G]Cristo [C]Jess,
      Ni [Am]credo, ni [D]forma, ni [G]palabra,
      Ni [D]santa [G]Iglesia, ni [B7]amor hu[Em]mano,
      Se [G]comparan con [Am]Ti, [D]mi [G]Señor.

      2
      Sé Tú supremo, oh Cristo Jesús,
      Tu amor me ha conquistado;
      Bajo Tu cruz muero al yo,
      Y vivo solo para Ti.
    LYRICS
    new_lyrics = <<~LYRICS
      # Capo 2

      1
      [G]Sé Tú su[D]preme, oh [G]Cristo [C]Jesús,
      Ni [Am]credo, ni [D]forma, ni [G]palabra,
      Ni [D]santa [G]Iglesia, ni [B7]amor hu[Em]mano,
      Se [G]comparan con [Am]Ti, [D]mi [G]Señor.

      2
      Sé Tú supremo, oh Cristo Jesús,
      Tu amor me ha conquistado;
      Bajo Tu cruz muero al yo,
      Y vivo solo para Ti.

      3
      Sé Tú supremo, oh Cristo Jesús,
      Transfigura mi vida;
      A través de este velo mortal,
      Brille Tu esplendor.
    LYRICS
    [song, {
      "title" => ["Se Tu Supremo", "Sé Tú Supremo"],
      "lyrics" => [old_lyrics, new_lyrics]
    }]
  end
end
