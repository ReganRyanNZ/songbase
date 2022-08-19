require 'test_helper'

class SongBookTest < ActiveSupport::TestCase
  test "deleted_after scope returns references of deleted songs as well as deleted references" do
    already_deleted = FactoryBot.create(:song_book)
    already_deleted.update(deleted_at: Time.now)
    already_deleted_via_song = FactoryBot.create(:song_book)
    already_deleted_via_song.song.update(deleted_at: Time.now)

    reference_to_delete = FactoryBot.create(:song_book)
    reference_to_delete_via_song = FactoryBot.create(:song_book)

    travel 1.second
    last_updated_at = Time.now
    travel 1.second

    reference_to_delete.update(deleted_at: Time.now)
    reference_to_delete_via_song.song.update(deleted_at: Time.now)

    reference_to_ignore = FactoryBot.create(:song_book)
    reference_to_ignore.update(deleted_at: Time.now)
    reference_to_ignore_via_song = FactoryBot.create(:song_book)
    reference_to_ignore_via_song.song.update(deleted_at: Time.now)

    assert_equal [reference_to_delete, reference_to_delete_via_song].map(&:id).sort,
                 SongBook.deleted_after(last_updated_at).map(&:id).sort
  end
end