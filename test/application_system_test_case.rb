require "test_helper"

# WARNING:
#
# System tests will include using the client's IndexedDB cache, which doesn't
# reset between tests like FactoryBot records. Best to start tests with
# visiting settings and clicking on the "reset cache" button.

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  # If you want to see the browser window open up and go through all the
  # motions, use this line instead:
  #
  # driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
  driven_by :selenium, using: :headless_chrome, screen_size: [1400, 1400]

  Capybara.default_max_wait_time = 2

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
    @test_book = FactoryBot.create(:book, name: 'Test Book', songs: {@song_from_the_time.id => '1',
                                                                     @song_abba_father.id => '2',
                                                                     @song_according_to.id => '3'})
    @book_songs = @english_songs
    travel 1.second
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
