class SongMailer < ApplicationMailer
  def lyrics_changed(song, lyrics_diff_html)
    @song = song
    @lyrics_diff_html = lyrics_diff_html

    mail(
      to: "recipient@example.com",
      subject: "Lyrics changed for #{@song.title}"
    )
  end
end
