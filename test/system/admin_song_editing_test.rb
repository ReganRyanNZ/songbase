require 'application_system_test_case'

class AdminSongEditingTest < ApplicationSystemTestCase
  test 'admins can create and edit songs' do
    setup_data

    # Create new song
    visit admin_path
    click_link('New Song')

    lyrics = 'La la la, doop da dee dee'
    fill_in('song_lyrics', with: lyrics)

    within('.preview') do
      assert_content lyrics
    end

    fill_in('song_title', with: 'My Title')

    select('English', from: 'song_lang')

    click_button('Create Song')

    # Flash message contains a link to the song
    assert_content 'Song was successfully created'
    click_link 'Click here'
    assert_content lyrics


    # Admin search
    visit admin_path
    assert_index_titles only: @all_songs
    fill_in 'admin_search', with: 'from the time'
    assert_index_titles only: @song_from_the_time

    # Edit existing song
    click_link @song_from_the_time.title
    assert_content "And that really, Jesus, You're alive!"

    fill_in('song_lyrics', with: @song_from_the_time.lyrics + "\nadding a new line woo")

    within('.preview') do
      assert_content "And that really, Jesus, You're alive!"
      assert_content "adding a new line woo"
    end

    # Lyrics input has hotkeys to help with chords:
    find('#song_lyrics').send_keys "\\"
    within('#song_lyrics') { assert_content 'woo[]' }
    find('#song_lyrics').send_keys "b"
    within('#song_lyrics') { assert_content 'woo[B]' }
    find('#song_lyrics').send_keys "b"
    within('#song_lyrics') { assert_content 'woo[Bb]' }


    refute_selector('#show-music-controls') # Toggle music button doesnt show for admin

    new_title = 'From the time I spoke Your Name, Lord my life...'
    fill_in('song_title', with: new_title)

    click_button 'Update Song'

    assert_content 'Song was successfully updated'
    assert_content new_title
    click_link 'Click here'
    assert_content "And that really, Jesus, You're alive!"
    assert_content "adding a new line woo"

    # Example formatting
    visit admin_path
    click_link('New Song')
    new_tab = window_opened_by { click_link('How do I format this?') }
    within_window new_tab do
      assert_selector('h1', text: 'Example Song')
      assert_content("Stanza numbers go above the\nFirst line of the stanza", count: 2)
    end
  end
end
