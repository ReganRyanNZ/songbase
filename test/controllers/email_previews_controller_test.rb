require "test_helper"

class EmailPreviewsControllerTest < ActionDispatch::IntegrationTest
  # Test env current_user is User.test_user(:admin) — a super admin — so the
  # happy-path tests exercise the super-admin view directly.
  test "index lists the email previews" do
    get admin_preview_emails_path
    assert_response :success
    assert_match(/Email previews/, response.body)
    assert_match(/BookMailer/, response.body)
    assert_match(/SongMailer/, response.body)
    assert_select "nav.admin-nav a", text: "Emails"
  end

  test "show renders the book_created email with sample data" do
    get admin_preview_email_path("book-created")
    assert_response :success
    assert_match(/share links for your records/, response.body)
    assert_match(/Camp Weekend 2026/, response.body)
    assert_match(%r{add_book=camp-w-48392}, response.body)
  end

  test "show renders the book_created_admin email" do
    get admin_preview_email_path("book-created-admin")
    assert_response :success
    assert_match(/New book created/, response.body)
    assert_match(/Camp Weekend 2026/, response.body)
    assert_match(/admin\/books/, response.body)
  end

  test "show renders the song_changed email with a lyrics diff" do
    get admin_preview_email_path("song-changed-update")
    assert_response :success
    assert_match(/Sé Tú Supremo/, response.body)
    assert_match(/ypsongs.spanish@gmail.com/, response.body)
    assert_match(/by Jethro Read/, response.body)
  end

  test "show renders the plain-text part when requested" do
    get admin_preview_email_path("book-created", part: "text")
    assert_response :success
    assert_match(/SHARE EDIT ACCESS/, response.body)
    assert_match(%r{add_book=camp-w-48392}, response.body)
  end

  test "show renders the song email's plain-text diff when requested" do
    get admin_preview_email_path("song-changed-update", part: "text")
    assert_response :success
    assert_match(/- .*Jess/, response.body)
    assert_match(/\+ .*Jesús/, response.body)
  end

  test "unknown preview id redirects back to the index" do
    get admin_preview_email_path("nope")
    assert_redirected_to admin_preview_emails_path
  end

  test "non-super-admins are bounced from index and show" do
    with_super_admin(false) do
      get admin_preview_emails_path
      assert_redirected_to admin_path

      get admin_preview_email_path("book-created")
      assert_redirected_to admin_path
    end
  end

  private

  # Stub ApplicationController#super_admin for the duration of a block
  # (same technique used in songs_controller_test / analytics_controller_test).
  def with_super_admin(value)
    original = ApplicationController.instance_method(:super_admin)
    ApplicationController.define_method(:super_admin) { value }
    begin
      yield
    ensure
      ApplicationController.define_method(:super_admin, original)
    end
  end
end
