class SongMailer < ApplicationMailer

  def song_changed(song, changes)
    @title = song.title
    @other_changes = format_changes(changes)
    @old_lyrics, @new_lyrics = diff_lyrics(*changes[:lyrics])

    mail(
      to: SUPPORT_EMAIL,
      subject: "Song update for \"#{song.title}\""
    )
  end

  private

  def format_changes(changes)
    changes.except(:lyrics).map do |attribute, (old, new)|
      [attribute, removed_line(old), added_line(new)]
    end
  end

  def format_line(line, color)
    "<div style='background:#{color}; white-space: pre-wrap;'>#{ERB::Util.html_escape(line.chomp)}</div>"
  end

  def normal_line(line) = format_line(line, "#f8f8f8")
  def added_line(line) = format_line(line, "#dfd")
  def removed_line(line) = format_line(line, "#fdd")

  def diff_lyrics(old_lyrics=nil, new_lyrics=nil)
    return unless new_lyrics.present?

    old_lines = old_lyrics.to_s.lines
    new_lines = new_lyrics.to_s.lines

    # If a line in the old text doesn't exist in the new text, make it red
    formatted_old = old_lines.map { |line| line.in?(new_lines) ? normal_line(line) : removed_line(line) }.join("\n")

    # If a line in the new text doesn't exist in the old text, make it green
    formatted_new = new_lines.map { |line| line.in?(old_lines) ? normal_line(line) : added_line(line) }.join("\n")

    [formatted_old, formatted_new]
  end

end
