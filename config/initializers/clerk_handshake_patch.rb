# Clerk's Rack middleware refreshes expired __session cookies by issuing a
# 307 redirect to its cross-origin handshake URL
# (Clerk::AuthenticateRequest#resolve_cookie_token rescues JWT::ExpiredSignature
# and calls `handshake`, which always returns [307, {location: ...}, []]).
#
# That redirect is followed transparently by the browser for full-page HTML
# navigations but breaks fetch()/XHR — a cross-origin redirect with
# credentials gets blocked, so the request never reaches Rails and the
# admin UI sees "Couldn't load songs." even though the user is signed in.
#
# `handle_handshake_maybe_status` already guards on `eligible_for_handshake?`
# (document request or Accept: text/html) before redirecting. We patch the
# bare `handshake` method — used by the JWT::ExpiredSignature /
# JWT::InvalidIatError rescue blocks in resolve_cookie_token — to apply the
# same guard. Non-eligible requests now get a plain 401 so client JS can
# react (e.g. fetch shows a clean error instead of an opaque CORS failure).
#
# We also piggyback Set-Cookie headers onto that 401 that expire `__session`
# across every plausible localhost host. Without this, a stale `__session`
# row from an older visit (different host, e.g. 127.0.0.1 vs localhost) can
# keep winning over the fresh cookie each handshake sets — the browser
# would never recover and the admin list would 401 forever. Clearing on 401
# means the next HTML navigation triggers a clean handshake and leaves a
# single fresh cookie.
#
# `current_user` / `super_admin` still resolve correctly on the next
# successful request because env["clerk"] continues to be populated by the
# signed_in path whenever a valid token is presented.

require "clerk/authenticate_request"

Clerk::AuthenticateRequest.class_eval do
  def handshake(_env, **opts)
    unless eligible_for_handshake?
      result = signed_out(enforce_auth: true, **opts)
      result[1][Clerk::SET_COOKIE_HEADER] ||= []
      result[1][Clerk::SET_COOKIE_HEADER] += expire_session_cookie_directives(_env)
      return result
    end

    redirect_headers = { Clerk::LOCATION_HEADER => redirect_to_handshake }
    [307, debug_auth_headers(**opts).merge(redirect_headers), []]
  end

  private

  def expire_session_cookie_directives(env)
    host = env['HTTP_HOST'] || env['SERVER_NAME'] || ''
    hosts = [host]
    # If the user has hopped between 127.0.0.1 and localhost, both rows
    # need clearing — we don't know which the stale cookie is on, so try
    # every plausible host. `nil` covers host-only cookies (no Domain=).
    hosts |= ['localhost', '127.0.0.1'] if host =~ /\A(localhost|127\.0\.0\.1)(:\d+)?\z/
    (hosts | [nil]).map do |h|
      parts = ["__session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"]
      parts << "Domain=#{h}" if h
      parts << "Secure; SameSite=None"
      parts.join('; ')
    end
  end
end
