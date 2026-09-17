class SongMailer < ApplicationMailer

  OVERSEERS_EMAILS = {
    "français" => ["sdayfranceusa@gmail.com", "sdaytranslationexec.services@gmail.com"],
    "español" => ["ypsongs.spanish@gmail.com", "victor.santamag@gmail.com"]
  }.freeze

  def song_changed(song, changes, editor_name = nil)
    @song = song
    @editor_name = editor_name
    @is_new_song = song.id_previously_changed?
    @attr_changes = changes.except("lyrics", :lyrics).map { |attribute, (old, new)| [attribute, old, new] }
    # previous_changes is indifferent-access, but accept plain string keys too.
    lyrics_change = changes[:lyrics] || changes["lyrics"]
    @lyrics_rows = diff_rows(lyrics_change&.first, lyrics_change&.last)
    # Songs are served by the catch-all /:id route (no named helper).
    @song_url = "#{root_url}#{song.id}"

    mail(
      to: OVERSEERS_EMAILS[song.lang.downcase].presence || SUPPORT_EMAIL,
      from: "song-diff@songbase.life",
      subject: @is_new_song ? "New Song: \"#{song.title}\"" : "Song update for \"#{song.title}\""
    )
  end

  private

  # Greedy two-pointer line diff with the same membership semantics as the old
  # side-by-side view (a line present in both versions is context, only-old is
  # a removal, only-new is an addition) but interleaved into one readable
  # sequence: removals are emitted directly before the additions that replace
  # them, and pure insertions/deletions stay in place.
  def diff_rows(old_lyrics, new_lyrics)
    old_lines = old_lyrics.to_s.lines.map(&:chomp)
    new_lines = new_lyrics.to_s.lines.map(&:chomp)
    rows = []
    i = j = 0

    while i < old_lines.size || j < new_lines.size
      old_line, new_line = old_lines[i], new_lines[j]

      if old_line == new_line
        rows << [:context, old_line]
        i += 1; j += 1
      elsif new_line && !old_lines.include?(new_line) && (old_line.nil? || new_lines.include?(old_line))
        # pure insertion — old_line reappears further down the new version
        rows << [:added, new_line]
        j += 1
      elsif old_line && !new_lines.include?(old_line) && (new_line.nil? || old_lines.include?(new_line))
        # pure deletion — new_line reappears further down the old version
        rows << [:removed, old_line]
        i += 1
      else
        # replacement (or both lines merely shifted) — pair them up
        rows << [:removed, old_line] if old_line
        rows << [:added, new_line] if new_line
        i += 1; j += 1
      end
    end

    rows
  end
end
