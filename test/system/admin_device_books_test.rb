require 'application_system_test_case'

# Verifies the AdminDeviceBooks component on /admin reads the device's
# IndexedDB (Dexie) cache and lists books that were synced during a prior
# visit to the main app. Controller tests can only confirm the component
# is mounted; this system test exercises the real client-side read path.

class AdminDeviceBooksTest < ApplicationSystemTestCase
  test 'admin page lists books cached on the device' do
    setup_data

    # sync_to_all books are pushed to every device on sync, so a fresh
    # visit to the app will cache this book in Dexie. Use a unique name
    # so we can pick it out regardless of leftover IDB state from prior
    # tests (IndexedDB persists between system tests).
    unique_name = "Device Sync Hymnal #{Time.now.to_i}"
    FactoryBot.create(:book,
                      name: unique_name,
                      sync_to_all: true,
                      songs: { @song_abba_father.id.to_s => '1' },
                      languages: ['english'])

    # Visit the main app to trigger the initial sync, which writes the
    # book into IndexedDB. Rather than relying on a specific cached-songs
    # count (IndexedDB persists between tests, so the number drifts), we
    # confirm the sync landed by opening the book index and looking for
    # the new book — once it's listed, it's in Dexie.
    visit root_path
    assert_selector 'h1', text: 'Songbase'
    find('div.book-icon').click
    assert_selector '.index_row_title', text: unique_name

    # Now hit the admin page. AdminDeviceBooks reads from Dexie on mount
    # and should include the book we just synced.
    visit admin_path
    within('.admin-device-books') do
      assert_content unique_name
      assert_content 'Public' # sync_to_all book renders as "Public"
    end
  end
end
