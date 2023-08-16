require 'application_system_test_case'

class SongAppTest < ApplicationSystemTestCase
  test 'visiting the app' do
    setup_data
    visit root_path

    # HTML loads:
    assert_selector 'h1', text: 'Songbase'

    # Songs load from API:
    assert_index_titles(only: @english_songs)

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
    find('div.settings-btn').click
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


    # Reset cache:
    assert_content "Cached songs: #{@all_songs.count}"
    find('button', text: 'Reset cache').click
    assert_content 'Cached songs: 0'
    assert_content "Cached songs: #{@all_songs.count}" # capybara will wait for it to sync again
    find('h1', text: 'Songbase').click


    # Selecting a book:
    find('div.settings-btn').click
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
  end

  private

  def setup_data
    @song_from_the_time = FactoryBot.create(:song)
    @song_according_to = FactoryBot.create(:song, :accord_to_my_earnest)
    @song_abba_father = FactoryBot.create(:song, :abba_father)
    @english_songs = [@song_from_the_time,
                      @song_according_to,
                      @song_abba_father]
    @song_bendito = FactoryBot.create(:song, :portuguese)
    @all_songs = @english_songs + [@song_bendito]
    @test_book = FactoryBot.create(:book, name: 'Test Book')
    @book_songs = @english_songs
    FactoryBot.create(:song_book, song: @song_from_the_time, book: @test_book, index: 1)
    FactoryBot.create(:song_book, song: @song_abba_father, book: @test_book, index: 2)
    FactoryBot.create(:song_book, song: @song_according_to, book: @test_book, index: 3)
    sleep(0.001)
  end

  def assert_index_titles(only:)
    only ||= @all_songs
    only = Array.wrap(only)
    exceptions = (@all_songs - only)

    only.each { |song| assert_content(song.title) }
    exceptions.each { |song| refute_content(song.title) }
  end

  def assert_book_titles(sort_by:)
    if sort_by == :alphabetical
      assert_content([@song_abba_father.title, '2',
                      @song_according_to.title, '3',
                      @song_from_the_time.title, '1'].join("\n"))
    else
      assert_content([@song_from_the_time.title, '1',
                      @song_abba_father.title, '2',
                      @song_according_to.title, '3',].join("\n"))
    end
  end

  def assert_capo(value)
    within('.transpose-value') { assert_text(value.to_s) }
  end

  # Note this has no waiting logic,
  # so the chord needs to already be rendered
  def assert_first_chord(chord)
    content = page.evaluate_script <<-SCRIPT
      (function () {
        var element = document.getElementsByClassName('chord')[0];
        var content = window.getComputedStyle(element, ':after').getPropertyValue('content');

        return content;
      })()
    SCRIPT
    assert_equal(chord, content.delete('"'))
  end
end