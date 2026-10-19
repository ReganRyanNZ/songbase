# Clerk SDK reads CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY from the
# environment by default. Only assign them here when present — the gem's
# setters validate the "sk_"/"pk_" prefix and would otherwise crash the
# boot process in environments where the keys aren't configured yet
# (e.g. CI, fresh checkouts, test runs without credentials).
Clerk.configure do |config|
  config.secret_key = ENV['CLERK_SECRET_KEY'] if ENV['CLERK_SECRET_KEY'].present?
  config.publishable_key = ENV['CLERK_PUBLISHABLE_KEY'] if ENV['CLERK_PUBLISHABLE_KEY'].present?

  # Excluded routes are skipped by the Clerk Rack middleware entirely.
  #
  # - /sign-in, /sign-up, /sign-out, /oauth-consent: our embedded auth
  #   pages mount Clerk JS components themselves; we don't want the
  #   middleware short-circuiting them with a handshake redirect.
  #
  # - /assets/*: Sprockets serves JS/CSS/images. They're public, but they
  #   still send the __session cookie (same origin). With the handshake
  #   patch in clerk_handshake_patch.rb, an expired cookie yields 401
  #   instead of 307 — which would block the bundle/stylesheet from
  #   loading and blank the page. Skip the middleware so assets always
  #   serve, regardless of cookie state.
  #
  # In the test environment there's no real Clerk backend (the secret key
  # is a dummy), so the middleware's handshake redirect decodes to a
  # garbage host like "v1" — which breaks system tests outright. The
  # controller's current_user synthesizes a test user (see
  # ApplicationController#current_user), so bypassing the middleware in
  # test keeps that path working without the redirect noise.
  config.excluded_routes = if Rails.env.test?
    %w[/*]
  else
    %w[
      /sign-in
      /sign-in/*
      /sign-up
      /sign-up/*
      /sign-out
      /sign-out/*
      /oauth-consent
      /oauth-consent/*
      /assets
      /assets/*
    ]
  end
end
