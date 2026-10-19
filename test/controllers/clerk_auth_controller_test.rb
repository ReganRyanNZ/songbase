require "test_helper"

class ClerkAuthControllerTest < ActionDispatch::IntegrationTest
  # The sign-in page embeds the sanitized target as
  #   redirectUrl: "..." (via @redirect_url.to_json)
  # so matching that snippet tells us exactly where Clerk JS will send the
  # user after signing in.
  test "path redirect_url passes through unchanged" do
    get "/sign-in", params: { redirect_url: "/admin/books" }
    assert_response :success
    assert_match(/redirectUrl:\s*"\/admin\/books",/, response.body)
  end

  test "same-origin absolute redirect_url is reduced to its path and query" do
    # Integration tests run against www.example.com — the absolute URL must
    # match that host to be considered same-origin.
    get "/sign-in", params: { redirect_url: "http://www.example.com/admin/books?x=1" }
    assert_response :success
    assert_match(/redirectUrl:\s*"\/admin\/books\?x=1",/, response.body)
  end

  test "cross-origin absolute redirect_url falls back to /admin" do
    get "/sign-in", params: { redirect_url: "https://evil.example/admin" }
    assert_response :success
    assert_match(/redirectUrl:\s*"\/admin",/, response.body)
  end

  test "scheme-relative and javascript: redirect_urls fall back to /admin" do
    get "/sign-in", params: { redirect_url: "//evil.example/admin" }
    assert_match(/redirectUrl:\s*"\/admin",/, response.body)

    get "/sign-in", params: { redirect_url: "/javascript:alert(1)" }
    assert_match(/redirectUrl:\s*"\/admin",/, response.body)

    get "/sign-in", params: { redirect_url: "javascript:alert(1)" }
    assert_match(/redirectUrl:\s*"\/admin",/, response.body)
  end

  test "missing redirect_url defaults to /admin" do
    get "/sign-in"
    assert_response :success
    assert_match(/redirectUrl:\s*"\/admin",/, response.body)
  end
end
