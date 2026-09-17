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

  # Patched copy of upstream resolve_handshake (clerk-sdk-ruby 4.2.1) with one
  # fix: on the signed-in path, upstream returns
  # `verify_token_with_retry(...)` — a bare [nil, {}, []] — DISCARDING the
  # Set-Cookie directives it just extracted from the handshake token. The
  # page renders signed-in but the fresh __session/__client_uat cookies never
  # reach the browser, so every subsequent navigation repeats the
  # stale-cookie → 307 handshake dance (and a dead dev-browser session
  # mid-dance bounces the user to whatever page initiated it). Carrying the
  # directives through lets Clerk::Rack::Middleware merge them into the app
  # response (it does this for nil-status results), so one successful
  # handshake actually persists the session.
  def resolve_handshake(env)
    headers = {
      Clerk::ACCESS_CONTROL_ALLOW_ORIGIN_HEADER => "null",
      Clerk::ACCESS_CONTROL_ALLOW_CREDENTIALS_HEADER => "true"
    }
    session_token = nil

    handshake_payload = verify_token(auth_context.handshake_token)
    unless handshake_payload
      return signed_out(enforce_auth: true, reason: Clerk::TokenVerificationErrorReason::JWK_FAILED_TO_RESOLVE)
    end

    cookies_to_set = handshake_payload[Clerk::HANDSHAKE_COOKIE_DIRECTIVES_KEY] || []
    cookies_to_set.each do |cookie|
      headers[Clerk::SET_COOKIE_HEADER] ||= []
      headers[Clerk::SET_COOKIE_HEADER] << cookie

      session_token = cookie.split(";")[0].split("=")[1] if cookie.start_with?("#{Clerk::SESSION_COOKIE}=")
    end

    if auth_context.development_instance?
      redirect_url = auth_context.clerk_url.dup
      remove_from_query_string(redirect_url, Clerk::HANDSHAKE_COOKIE)

      headers[Clerk::LOCATION_HEADER] = redirect_url.to_s
    end

    return signed_out(reason: Clerk::AuthErrorReason::SESSION_TOKEN_MISSING, headers: headers) unless session_token

    result = verify_token_with_retry(env, session_token)

    # PATCH: attach the handshake's Set-Cookie directives to the signed-in
    # pass-through result. The location header is deliberately NOT carried
    # over — the page renders at /path?__clerk_handshake=... and the app's
    # layout script strips the param client-side (no extra round-trip). A
    # nil result (token didn't verify without raising) falls back to a plain
    # signed-out response instead of crashing the middleware with
    # nil.empty? like upstream does.
    return signed_out if result.nil?
    if result.is_a?(Array) && result[0].nil?
      result[1][Clerk::SET_COOKIE_HEADER] = headers[Clerk::SET_COOKIE_HEADER] if headers[Clerk::SET_COOKIE_HEADER]
    end
    result
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
