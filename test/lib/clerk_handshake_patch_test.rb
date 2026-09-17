require "test_helper"

# Verifies the resolve_handshake patch in config/initializers/clerk_handshake_patch.rb.
# Upstream clerk-sdk-ruby 4.2.1 discards the handshake's Set-Cookie directives
# on the signed-in path, so the fresh __session cookie never reaches the browser
# and every navigation repeats the stale-cookie handshake dance. The patch
# carries the directives through so Clerk::Rack::Middleware persists them.
class ClerkHandshakePatchTest < ActiveSupport::TestCase
  class StubbedAuthRequest < Clerk::AuthenticateRequest
    # Bypass real JWT verification — any token "verifies" to a payload that
    # doubles as both the handshake payload (carrying cookie directives) and
    # the session claims.
    def verify_token(token, **opts)
      {
        "handshake" => @directives,
        "sub" => "user_test",
        "exp" => Time.now.to_i + 60,
        "iat" => Time.now.to_i
      }
    end
  end

  setup do
    @directives = [
      "__client_uat=#{Time.now.to_i}; Path=/; Domain=localhost; Max-Age=31536000; Secure; SameSite=None",
      "__session=fresh.jwt.value; Path=/; Expires=Fri, 17 Sep 2027 00:00:00 GMT; HttpOnly; Secure; SameSite=None"
    ]
  end

  test "successful handshake carries the fresh session cookies on the signed-in response" do
    request = build_request(directives: @directives)

    result = request.resolve_handshake({})

    assert_nil result[0], "signed-in results pass through to the app (nil status)"
    assert_equal @directives, result[1][Clerk::SET_COOKIE_HEADER],
      "the handshake Set-Cookie directives must survive so the middleware persists the session"
    assert result[1][Clerk::SET_COOKIE_HEADER].any? { |c| c.start_with?("__session=fresh") }
  end

  test "handshake without a session directive stays signed out but still sets its cookies" do
    # A signed-out handshake (dead dev-browser session) clears __session and
    # sets __client_uat=0 — upstream behavior, kept intact.
    clear_directives = [
      "__client_uat=0; Path=/; Domain=localhost; Max-Age=31536000; Secure; SameSite=None",
      "__session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None"
    ]
    request = build_request(directives: clear_directives)

    result = request.resolve_handshake({})

    assert_nil result[0]
    assert_equal clear_directives, result[1][Clerk::SET_COOKIE_HEADER]
    location = result[1][Clerk::LOCATION_HEADER]
    assert location.start_with?("http://localhost:3000/admin"),
      "dev handshakes redirect back to the initiating page — got #{location.inspect}"
    refute location.include?("__clerk_handshake"), "handshake param must be stripped from the redirect"
  end

  private

  def build_request(directives:)
    context = OpenStruct.new(
      handshake_token: "fake.handshake.jwt",
      development_instance?: true,
      clerk_url: URI("http://localhost:3000/admin?__clerk_handshake=fake.jwt")
    )
    StubbedAuthRequest.new(context).tap { |r| r.instance_variable_set(:@directives, directives) }
  end
end
