require 'test_helper'

class SongsControllerTest < ActionDispatch::IntegrationTest
  # SongsController#destroy is CSRF-protected; disable forgery protection in
  # tests so we can DELETE directly, and restore it after.
  setup { ActionController::Base.allow_forgery_protection = false }
  teardown { ActionController::Base.allow_forgery_protection = true }

  test 'super admin can delete any song' do
    # In the test environment current_user is a super-admin test user.
    song = FactoryBot.create(:song, :abba_father)

    delete song_path(song)

    assert_response :redirect
    assert Song.unscoped.find(song.id).deleted_at.present?, 'song should be soft-deleted'
  end

  test 'non-super-admin cannot delete a song older than 7 days' do
    with_super_admin(false) do
      song = FactoryBot.create(:song, :abba_father)
      song.update_columns(created_at: 10.days.ago) # older than the 7-day window

      delete song_path(song)

      assert_response :redirect
      assert_nil Song.unscoped.find(song.id).deleted_at, 'old song should NOT be deleted'
    end
  end

  test 'non-super-admin can delete a song created within 7 days' do
    with_super_admin(false) do
      song = FactoryBot.create(:song, :abba_father) # created moments ago

      delete song_path(song)

      assert_response :redirect
      assert Song.unscoped.find(song.id).deleted_at.present?, 'recent song should be deleted'
    end
  end

  private

  # Stub ApplicationController#super_admin for the duration of a block
  # (same technique used in books_controller_test / analytics_controller_test).
  def with_super_admin(value)
    original = ApplicationController.instance_method(:super_admin)
    ApplicationController.define_method(:super_admin) { value }
    begin
      yield
    ensure
      ApplicationController.define_method(:super_admin, original)
    end
  end
end
