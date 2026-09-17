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

  # Line diff (context / removed / added) based on the longest common
  # subsequence, so a line only counts as unchanged when it's genuinely in
  # sequence — reordered stanzas diff as removal+addition instead of pairing
  # up unrelated neighbours. Falls back to the cheap greedy pairing when the
  # DP table (O(n·m) cells) would get huge.
  def diff_rows(old_lyrics, new_lyrics)
    old_lines = old_lyrics.to_s.lines.map(&:chomp)
    new_lines = new_lyrics.to_s.lines.map(&:chomp)

    return new_lines.map { |line| [:added, line] } if old_lines.empty?

    return greedy_diff_rows(old_lines, new_lines) if old_lines.length * new_lines.length > 1_000_000

    # LCS lengths for every suffix pair, built back-to-front.
    lcs = Array.new(old_lines.length + 1) { Array.new(new_lines.length + 1, 0) }
    (old_lines.length - 1).downto(0) do |i|
      (new_lines.length - 1).downto(0) do |j|
        lcs[i][j] = if old_lines[i] == new_lines[j]
          lcs[i + 1][j + 1] + 1
        else
          [lcs[i + 1][j], lcs[i][j + 1]].max
        end
      end
    end

    # Walk the table forward, emitting hunks.
    rows = []
    i = j = 0
    while i < old_lines.length && j < new_lines.length
      if old_lines[i] == new_lines[j]
        rows << [:context, old_lines[i]]
        i += 1; j += 1
      elsif lcs[i + 1][j] >= lcs[i][j + 1]
        rows << [:removed, old_lines[i]]
        i += 1
      else
        rows << [:added, new_lines[j]]
        j += 1
      end
    end
    while i < old_lines.length
      rows << [:removed, old_lines[i]]
      i += 1
    end
    while j < new_lines.length
      rows << [:added, new_lines[j]]
      j += 1
    end

    rows
  end

  # Cheap fallback for very large songs: pair lines positionally, treating a
  # mismatch as a replacement. Degrades on reordered blocks but never explodes.
  def greedy_diff_rows(old_lines, new_lines)
    rows = []
    i = j = 0
    while i < old_lines.size || j < new_lines.size
      old_line, new_line = old_lines[i], new_lines[j]
      if old_line == new_line
        rows << [:context, old_line]
        i += 1; j += 1
      else
        rows << [:removed, old_line] if old_line
        rows << [:added, new_line] if new_line
        i += 1; j += 1
      end
    end
    rows
  end
end
