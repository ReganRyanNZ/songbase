require 'application_system_test_case'

# System tests for the two-pane book builder (/books/new): Find songs on the
# left, Your book on the right. Client-side only (PWA service worker makes
# end-to-end save flaky in the reused test browser — see
# admin_device_books_test). Persistence is covered by the BooksController and
# API test suites.

class BookFormTest < ApplicationSystemTestCase
  test 'search in the Find songs pane and add to the book pane' do
    setup_data
    visit new_book_path
    fill_in 'Book title', with: "Sys Add #{Time.now.to_i}"

    find('input[aria-label="Search songs"]').set('Abba, Father')
    within find('.find-pane .song-item', text: @song_abba_father.title, match: :first) do
      find('.btn-add').click
    end

    within '.book-pane' do
      assert_content @song_abba_father.title
      assert_selector '.book-song-number', text: '1'
    end
  end

  test 'numbers are automatic and resequence on remove' do
    setup_data
    visit new_book_path
    fill_in 'Book title', with: "Sys Number #{Time.now.to_i}"

    find('input[aria-label="Search songs"]').set('Abba, Father')
    within find('.find-pane .song-item', text: @song_abba_father.title, match: :first) do
      find('.btn-add').click
    end
    find('input[aria-label="Search songs"]').set('According to my earnest')
    within find('.find-pane .song-item', text: @song_according_to.title, match: :first) do
      find('.btn-add').click
    end

    within '.book-pane' do
      assert_selector '.song-item .book-song-number', text: '1'
      assert_selector '.song-item .book-song-number', text: '2'
      first('.song-item').find('.btn-remove').click
      assert_selector '.song-item', count: 1
      assert_selector '.book-song-number', text: '1'
    end
  end

  test 'multi-tune song gets an adjustable tune chip in the book pane' do
    setup_data
    visit new_book_path
    fill_in 'Book title', with: "Sys Tunes #{Time.now.to_i}"

    find('input[aria-label="Search songs"]').set('Be Thou supreme')
    within find('.find-pane .song-item', text: @song_be_thou_supreme.title, match: :first) do
      find('.btn-add').click
    end

    within '.book-pane' do
      assert_selector '.tune-badge', text: 'Tune 1'
      find('.tune-badge').click
      assert_selector '.tune-expand .tune-option', count: 2
      all('.tune-expand .tune-option').last.click
      assert_selector '.tune-badge', text: 'Tune 2'
    end
  end

  test 'Paste titles opens the overlay on the paste tab' do
    setup_data
    visit new_book_path
    fill_in 'Book title', with: "Sys Paste #{Time.now.to_i}"

    click_on 'Paste titles'
    assert_selector '.add-songs-modal', visible: true
    assert_selector '.asm-tab.active', text: 'Paste'
    assert_selector '.paste-textarea', visible: true

    click_on 'Search'
    assert_selector '.asm-tab.active', text: 'Search'
    assert_no_selector '.paste-textarea'
  end
end
