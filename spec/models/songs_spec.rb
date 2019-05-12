require 'rails_helper'

describe Song do

  describe ".titles" do
    it "returns titles from first line, chorus, and title field" do
      titles = {
        firstline_title: "From the time I spoke Your Name",
        chorus_title: "Now my eyes begin to see",
        custom_title: "Jesus, You're alive"
      }
      song = FactoryBot.create(:song, titles)
      expect(song.titles).to match titles
    end
  end

  describe ".guess_firstline_title" do
    it "returns the first line of the song" do
      song = FactoryBot.create(:song, lyrics: "
# Revelation 5:12-13
1
Blessing and honor and glory be Thine,
And glory be Thine,
And glory be Thine.
Blessing and honor and glory be Thine,
Both now and evermore.
Praise Him! Praise Him!
All ye saints adore Him.
Praise Him! Praise Him!
Both now and evermore.
Hallelujah!
Blessing and honor and glory be Thine,
And glory be Thine,
And glory be Thine.
Blessing and honor and glory be Thine,
Both now and evermore."
      )
      expect(song.guess_firstline_title).to eq("Blessing and honor and glory be Thine")
    end
  end

  describe ".guess_chorus_title" do
    it "returns the first line of the chorus" do
      song = FactoryBot.create(:song)
      expect(song.guess_chorus_title).to eq("Now my eyes begin to see")
    end
  end

  describe ".merge!" do
    it "keeps indicies of old song and destroys old song" do
      book = FactoryBot.create(:book)
      song1 = FactoryBot.create(:song, :hymn_ref_in_comments)
      songbook = FactoryBot.create(:song_book, song: song1, book: book)
      song2 = FactoryBot.create(:song, :no_chords)
      song2.merge!(song1)
      expect(song2.reload.books.include? book).to be true
      expect(song1.persisted?).to be false
      expect(song2.lyrics).to eq(song1.lyrics[15..-1])
    end
  end

  describe "#duplicates" do
    it "returns duplicate songs" do
      title = {firstline_title: "From the time I spoke Your Name"}
      song1 = FactoryBot.create(:song, title)
      song2 = FactoryBot.create(:song, title)
      expect(Song.duplicates).to match_array [song1, song2]
    end
  end

  describe "#recently_changed" do
    it "returns recently changed songs" do
      song1 = FactoryBot.create(:song)
      song2 = FactoryBot.create(:song, updated_at: 2.years.ago)
      expect(Song.recently_changed).to match_array [song1]
    end
  end
end