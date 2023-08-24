require 'selenium-webdriver'
require 'nokogiri'
require 'capybara'

Capybara.register_driver :headless_chrome do |app|
  options = Selenium::WebDriver::Chrome::Options.new
  options.add_argument('--headless')
  options.add_argument('--disable-gpu')
  options.add_argument('--window-size=1280,800')

  driver = Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
end

Capybara.javascript_driver = :headless_chrome
Capybara.configure do |config|
  config.default_max_wait_time = 6
  config.default_driver = :headless_chrome
end


namespace :scraper do
  task portuguese: :environment do |args|
    WHITESPACE_AT_START_OF_LINE = /^[[:space:]]+/
    WHITESPACE_AT_END_OF_LINE = /[[:space:]]+$/
    page = Capybara.current_session
    browser = page.driver.browser

    page.visit "http://hinario.org/number.php"
    page.click_link('Demos glória a Deus Pai')
    page.assert_text('Contemplando a natureza')

    # page.visit "https://hinario.org/detail.php?id=1565"
    # page.assert_selector('.hym-title h4', text: 1483)

    songs = {}

    finished_scraping = false
    while(!finished_scraping) do
      doc = Nokogiri::HTML(browser.page_source)
      raw_stanzas = doc.css('#hymntextdata p,#hymntextdata > h5 > div')

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

      title = doc.at_css('span.colr h4').text
      title = get_title_from_first_line(raw_stanzas.first.text.split("\n").first) unless title.present?
      index = doc.at_css('.hym-title h4').text
      lyrics = stanzas.join("\n\n")
      lyrics = remove_excess_newlines(lyrics)
      lyrics = fix_quotes(lyrics)

      song = Song.find_or_create_by(title: title, lyrics: lyrics, lang: 'português')
      songs[song.id.to_s] = index

      puts "Created: [#{index}] #{title}"

      page.find('#rightarrowid').click # go to next song
      begin
        page.assert_selector('.hym-title h4', text: index.to_i + 1)
      rescue Capybara::ExpectationNotMet => e
        puts "Reached the end at #{index}"
        finished_scraping = true
      end
    end

    hymnal = Book.find_or_create_by(name: 'Hinos',
      slug: 'hinos',
      languages: ['português'])

    hymnal.songs = songs
    hymnal.save
  end

  def get_title_from_first_line(text)
    text.gsub(/^S-\d+/, '') # without book reference
        .at(/[[:alpha:]].*/) # without leading digit or whitespace
        .at(/.*[^\,\.\;\—\–\-\_\!]/) # without trailing punct
  rescue
    text
  end

  def fix_quotes(text)
    text.gsub('’', "'")
        .gsub('‘', "'")
        .gsub('“', '"')
        .gsub('”', '"')
  end

  def move_stanza_numbers_to_newline(text)
    text.gsub(/(^|\n)(\d+)[[:space:]]{2}/) {|match| [$1, $2, "\n"].join}
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
