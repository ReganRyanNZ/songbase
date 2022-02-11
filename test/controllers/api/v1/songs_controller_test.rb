require 'test_helper'

class SongsControllerTest < ActionDispatch::IntegrationTest
  test "GET #app_data" do

    deleted_song = FactoryBot.create(:song)
    sleep 1
    time_of_fetch = js_time_now
    @songs = [FactoryBot.create(:song), FactoryBot.create(:song, firstline_title: "Another song", lyrics: "Different words[G]")]
    sleep 1
    song_to_ignore = FactoryBot.create(:song)

    deleted_song.destroy_with_audit
    song_to_ignore.destroy_with_audit

    get api_v1_app_data_path, params: {updated_at: time_of_fetch}

    songs_response = JSON.parse(response.body, symbolize_names: true)
    song_data = [
      {:title=>"From the time I spoke Your Name", :lang=>"en", :lyrics=>"1\nFrom the [D]time I [G]spoke Your [D]Name,\nLord, my l[G]ife's not been the [D]same\n[]Since I called on the only One Who'd\n[A]Save me[A7].\nWhen fors[D]aken, [G]in desp[D]air—\nWho'd have t[G]hought that You'd be t[D]here?\nNow I've found out, [A]Jesus, You're [D]ali[D7]ve!\n\n  Now my [G]eyes begin to see\n  I'm living [D]as I ought to be,\n  As this [G]turning, burning God\n  Moves in my [A]heart.[A7]\n  I don't [D]care now [G]how I [D]feel;\n  I just [G]know that this is [D]real,\n  And I know, O [A]Jesus, You're a[D]live!\n\n2\nAll my friends may think it’s square,\nSince I’ve touched You I don’t care,\nFor I’ve found You’re the only life worth living.\nThough some mock and criticise,\nLord, they just don’t realise\nThat I’ve found out, Jesus, You’re alive!\n\n3\nIt's no statue that I call,\nNot a picture on the wall,\nBut a Person Who lives His life\nwithin me.\nWish they'd told me long before,\nAll You want's an open door,\nAnd that really, Jesus, You're alive!"},
      {:title=>"Another song", :lang=>"en", :lyrics=>"Different words[G]"}
    ]

    assert_response :success
    assert_equal [deleted_song.id], songs_response[:destroyed][:songs]
    assert_equal song_data, songs_response[:songs].map{|song| song.except(:id)}
  end

  def js_time_now
    (Time.now.to_f*1000).to_i
  end
end
