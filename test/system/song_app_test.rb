require 'application_system_test_case'

class SongAppTest < ApplicationSystemTestCase
  test 'visiting the app' do
    setup_data
    visit root_path

    # HTML loads:
    assert_selector 'h1', text: 'Songbase'

    # Songs load from API:
    assert_index_titles(only: @english_songs)

    # Reset cache:
    find('div.settings-btn').click
    find('button', text: 'Reset cache').click
    assert_content 'Cached songs: 0'
    assert_content "Cached songs: #{@all_songs.count}" # capybara will wait for it to sync again
    find('h1', text: 'Songbase').click

    # Typing in search scopes the songs:
    fill_in 'index_search', with: 'magnified in my body'
    assert_index_titles(only: @song_according_to)

    # Clicking on index row displays that song:
    find('.index_row_title', text: 'According to my earnest').click
    assert_content 'magnified in my'

    assert_capo('0')
    assert_first_chord('G')

    find('#transpose-up').click
    assert_capo('1')
    assert_first_chord('Ab')

    find('#transpose-down').click
    assert_capo('0')
    assert_first_chord('G')

    # Returning to index will still have the search:
    find('h1', text: 'Songbase').click
    assert_index_titles(only: @song_according_to)

    # Clear search with × button
    find('div.btn_clear_search').click
    assert_index_titles(only: @english_songs)

    # Selecting languages in settings scopes the index to those languages:
    find('div.settings-btn').click
    assert_selector 'h2', text: 'Languages'

    check 'Portuguese'
    find('h1', text: 'Songbase').click
    assert_index_titles(only: @all_songs)

    find('div.settings-btn').click
    uncheck 'English'
    find('h1', text: 'Songbase').click
    assert_index_titles(only: @song_bendito)

    # Selecting theme in settings:
    find('div.settings-btn').click
    find('label', text: 'Night').click
    assert_selector 'body.css-night'
    refute_selector 'body.css-normal'
    find('label', text: 'Normal').click
    refute_selector 'body.css-night'
    assert_selector 'body.css-normal'

    # Selecting a book:
    check 'English'
    check 'Portuguese'
    find('h1', text: 'Songbase').click
    assert_index_titles(only: @all_songs)

    find('div.book-icon').click
    find('span.index_row_title', text: @test_book.name).click

    # Book title at the top:
    refute_selector('h1', text: 'Songbase')
    assert_selector('h1', text: @test_book.name)

    # Book scopes songs:
    assert_index_titles(only: @book_songs)

    # Song order is alphabetical:
    assert_book_titles(sort_by: :alphabetical)

    # Books can sort by index:
    find('div.btn-sort').click
    assert_book_titles(sort_by: :index)

    # And switch back to alphabetical:
    find('div.btn-sort').click
    assert_book_titles(sort_by: :alphabetical)

    # A book's song has a reference to that book in the song's display:
    find('.index_row_title', text: @song_abba_father.title).click
    assert_content 'Here at the table with the saints'
    assert_content 'Test Book: #2'

    # A book's song has the book + index as the title:
    within('h1.home-title') do
      assert_content 'Test Book'
      assert_selector('div.title-number', text: '2')
    end

    # Reference is a link that brings up book index sorted by index:
    find('div.song-reference', text: 'Test Book: #2').click
    assert_book_titles(sort_by: :index)

    # Clicking book icon will exit out of current book:
    find('div.book-icon').click
    assert_index_titles(only: @all_songs)

    # Test preloaded pages
    visit @song_abba_father.id.to_s
    assert_content(@song_abba_father.title)
  end
end
