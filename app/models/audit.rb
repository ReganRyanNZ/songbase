class Audit < ApplicationRecord
  belongs_to :song
  belongs_to :user
  before_save :add_user_to_song

  def add_user_to_song
    song.update(last_editor: user.name)
  end
end