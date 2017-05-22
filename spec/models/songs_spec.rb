require 'rails_helper'

describe Api::V1::Song do

  describe ".titles" do

    it "returns titles from first line, chorus, and title field" do
      song = FactoryGirl.create(:song)
      expect(song.titles).to match ["Jesus, You're alive", "From the time I spoke Your Name", "Now my eyes begin to see"]
    end
  end

end