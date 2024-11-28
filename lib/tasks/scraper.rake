# NOTE
# For this to work on production, the server needs to have chrome installed.
# For Heroku, you need to add the following buildpack:
# https://github.com/heroku/heroku-buildpack-google-chrome.git

require 'selenium-webdriver'
require 'nokogiri'
require 'capybara'

Capybara.register_driver :headless_chrome do |app|
  options = Selenium::WebDriver::Chrome::Options.new
  options.add_argument('--headless')
  options.add_argument("--no-sandbox");
  options.add_argument('--disable-gpu')
  options.add_argument('--window-size=1280,800')

  Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
end

Capybara.javascript_driver = :headless_chrome
Capybara.configure do |config|
  config.default_max_wait_time = 6
  config.default_driver = :headless_chrome
end


namespace :scraper do
  task portuguese: :environment do |args|
    UPDATE_ONLY = true # True when fixing existing songs, instead of creating new ones
    WHITESPACE_AT_START_OF_LINE = /^[[:space:]]+/
    WHITESPACE_AT_END_OF_LINE = /[[:space:]]+$/
    page = Capybara.current_session
    browser = page.driver.browser

    # for testing 1 song first, call the scraper like: rails scraper:portuguese TEST_ID=7
    test_song = [ENV['TEST_ID']].compact.presence

    ids_to_search = test_song || (1..1500).map(&:to_s)
    console_data = []
    songs = {}

    ids_to_search.each do |id|
      page.visit("https://hinario.org/number.php?search=#{id}")
      page.find('#finaldata tbody tr:first-of-type td a').click
      page.assert_selector('.hym-title h4', text: id)

      doc = Nokogiri::HTML(browser.page_source)
      raw_stanzas = doc.css('#hymntextdata p,#hymntextdata > h5 > div')
      raw_stanzas = raw_stanzas.children if raw_stanzas.count == 1

      stanzas = raw_stanzas.map do |stanza|
        if is_book_ref?(stanza)
          nil
        elsif is_chorus?(stanza)
          stanza.text.gsub(WHITESPACE_AT_START_OF_LINE, '  ')
                     .gsub(WHITESPACE_AT_END_OF_LINE, '')
        else
          text = move_stanza_numbers_to_newline(stanza.text)
          text.gsub(WHITESPACE_AT_START_OF_LINE, '')
              .gsub(WHITESPACE_AT_END_OF_LINE, '')
        end
      end.compact

      index = doc.at_css('.hym-title h4').text
      lyrics = stanzas.join("\n\n")
      lyrics = remove_excess_newlines(lyrics)
      lyrics = fix_quotes(lyrics)
      title = doc.at_css('span.colr h4').text
      title = get_title_from_first_line(lyrics) unless title.present?
      title = strip_title(title)

      console_data << [title, lyrics, nil, index]
      if UPDATE_ONLY
        song = Song.from_book(hymnal, index)
        if song.has_chords?
          puts "Already with chords: [#{index}] #{title}"
        else
          song.update(lyrics: lyrics, title: title)
          puts "Updated: [#{index}] #{title}"
        end
      else
        song = Song.find_or_create_by(title: title, lyrics: lyrics, lang: 'português')
        songs[song.id.to_s] = index
        puts "Created: [#{index}] #{title}"
      end
    end

    # puts console_data
    hymnal.songs = songs
    hymnal.save unless UPDATE_ONLY
  end

  def hymnal
    @hymnal ||= Book.find_or_create_by(name: 'Hinos', slug: 'hinos', languages: ['português'])
  end

  def get_title_from_first_line(text)
    text.at(/[[:alpha:]].*/) # without leading digit or whitespace
        .at(/.*[^\,\.\;\—\–\-\_\!]/) # without trailing punct
  rescue
    text
  end

  def strip_title(title)
    title.gsub(/^S-\d+/, '').strip
  end

  def fix_quotes(text)
    text.gsub('’', "'")
        .gsub('‘', "'")
        .gsub('“', '"')
        .gsub('”', '"')
  end

  def move_stanza_numbers_to_newline(text)
    text.gsub(/(^|\n)(\d+)[[:space:]]+/) {|match| [$1, $2, "\n"].join}
  end

  def remove_excess_newlines(text)
    text.gsub("\n\n\n\n", "\n\n")
        .sub(/\n+\z/, '')
        .sub(/\A\n+/, '')
  end

  def is_chorus?(stanza_node)
    stanza_node.to_s.downcase[/(0000cd|0000ff)/]
  end

  def is_book_ref?(stanza)
    stanza.text.match?(/^S-\d+/)
  end
end
