require 'rails_helper'

describe Api::V1::Song do

  describe ".titles" do

    it "returns titles from first line, chorus, and title field" do
      titles = {
        firstline_title: "From the time I spoke Your Name",
        chorus_title: "Now my eyes begin to see",
        custom_title: "Jesus, You're alive"
      }
      song = FactoryGirl.create(:song, titles)
      expect(song.titles).to match titles
    end
  end

end