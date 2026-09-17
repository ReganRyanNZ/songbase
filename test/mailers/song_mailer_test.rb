require "test_helper"

class SongMailerTest < ActionMailer::TestCase
  test "update email goes to the language overseers with a unified diff" do
    song = Song.new(lang: "español", title: "Sé Tú Supremo")
    song.id = 322
    # Same shape as previous_changes at the production call site. (Staging the
    # old lyrics through Song.new + reassignment doesn't work — dirty tracking
    # diffs against the pristine default, so everything would look added.)
    changes = {
      "lyrics" => [
        "1\nSé Tú supremo, oh Cristo Jess\n2\nSé Tú supremo\n",
        "1\nSé Tú supremo, oh Cristo Jesús\n2\nSé Tú supremo\n3\nNuevo verso\n"
      ]
    }

    email = SongMailer.song_changed(song, changes, "Regan Ryan").deliver_now

    assert_equal ["ypsongs.spanish@gmail.com", "victor.santamag@gmail.com"], email.to
    assert_equal "song-diff@songbase.life", email[:from].to_s
    assert_equal 'Song update for "Sé Tú Supremo"', email.subject

    html = email.html_part.body.decoded
    assert_match(/#fdd/, html)            # removed-line background
    assert_match(/#dfd/, html)            # added-line background
    assert_match(/by Regan Ryan/, html)   # editor name in the meta line
    assert_match(/oh Cristo Jess/, html)  # removed line (typo)
    assert_match(/oh Cristo Jesús/, html) # added line (fix)
    # Diff cells are white-space:pre-wrap — the line content must sit flush
    # inside the cell or every row renders with leading blank space (the
    # "giant diff" bug).
    assert_match(%r{>Sé Tú supremo, oh Cristo Jess</td>}, html)
    assert_match(%r{>Sé Tú supremo, oh Cristo Jesús</td>}, html)
    assert_match(%r{http://test\.host/322}, html) # "View song" link
    # Attribute changes only render for updates, and this fixture only
    # changed lyrics.
    refute_match(/Old Title/, html)

    text = email.text_part.body.decoded
    assert_match(/by Regan Ryan/, text)
    assert_match(/- .*oh Cristo Jess/, text)
    assert_match(/\+ .*oh Cristo Jesús/, text)
    assert_match(/^\+ 3\r?$/, text) # added verse number
    assert_match(%r{http://test\.host/322}, text)
  end

  test "new song email goes to the support address when the language has no overseers" do
    song = Song.new(lang: "english")
    song.id = 321
    song.title = "Be Thou Supreme"
    song.lyrics = "1\nBe Thou supreme\n"
    song.define_singleton_method(:id_previously_changed?) { true }

    email = SongMailer.song_changed(song, song.changes.except(:updated_at, :created_at, :id)).deliver_now

    assert_equal ["songbase.brothers@gmail.com"], email.to
    assert_equal 'New Song: "Be Thou Supreme"', email.subject

    # Everything is an addition — no removed lines at all.
    html = email.html_part.body.decoded
    refute_match(/#fdd/, html)
    assert_match(/#dfd/, html)
  end
end
