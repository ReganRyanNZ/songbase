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

  # Super-admin should reach every section in the admin chrome (Songs, Books,
  # Analytics, Cache, Trash) and each page should render with its data.
  test 'super admin can load every admin page with data' do
    song  = FactoryBot.create(:song, :abba_father)
    book  = FactoryBot.create(:book, name: 'Super Hymnal', sync_to_all: true,
                               songs: { song.id.to_s => '1' }, languages: ['english'])

    # Songs — page body should include the song and the device-books component.
    get admin_path
    assert_response :success
    assert_match(/Abba, Father/, response.body)
    assert_match(/AdminDeviceBooks/, response.body)

    # Books — page body should include the book name.
    get admin_books_path
    assert_response :success
    assert_match(/Super Hymnal/, response.body)

    # Analytics, Cache, Trash — each section landing should render.
    get admin_analytics_path
    assert_response :success
    get admin_cache_path
    assert_response :success
    get admin_trash_path
    assert_response :success
  end

  # Regular (non-super) admins only get the Songs section. Books / Analytics /
  # Cache / Trash are super-admin-only and should redirect away. The Songs
  # page must still render the device-books component so they can see what
  # is cached locally on their device.
  test 'regular admin loads songs and device books but is blocked from other sections' do
    song = FactoryBot.create(:song, :abba_father)

    with_super_admin(false) do
      get admin_path
      assert_response :success
      assert_match(/Abba, Father/, response.body)
      # Device-books React component is mounted on the Songs page.
      assert_match(/AdminDeviceBooks/, response.body)

      # Every super-admin-only section should bounce a regular admin out.
      [admin_books_path, admin_analytics_path, admin_cache_path, admin_trash_path].each do |path|
        get path
        assert_response :redirect, "expected #{path} to redirect a non-super-admin"
      end
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
