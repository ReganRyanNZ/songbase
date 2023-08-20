require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  # If you want to see the browser window open up and go through all the
  # motions, use this line instead:
  #
  # driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
  driven_by :selenium, using: :headless_chrome, screen_size: [1400, 1400]

  Capybara.default_max_wait_time = 2

  private

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
    travel(1.second)
  end

  def assert_index_titles(only:)
    only ||= @all_songs
    only = Array.wrap(only)
    exceptions = (@all_songs - only)

    only.each { |song| assert_content(song.title) }
    exceptions.each { |song| refute_content(song.title) }
  end
end
