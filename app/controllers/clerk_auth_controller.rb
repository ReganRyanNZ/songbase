class ClerkAuthController < ApplicationController
  # These pages are public — they ARE the sign-in flow. The Clerk
  # middleware is told to leave them alone via config.excluded_routes
  # in config/initializers/clerk.rb.
  layout "clerk_auth"

  before_action :set_redirect_url
  before_action :discard_stale_flash

  def sign_in
  end

  def sign_up
  end

  def sign_out
  end

  def oauth_consent
  end

  private

  # Default to /admin after auth — that's where editors land. Whitelist
  # to relative paths on our own host so an open redirect can't be
  # crafted via ?redirect_url=https://evil.example.
  def set_redirect_url
    raw = params[:redirect_url].to_s
    @redirect_url = safe_redirect_url(raw)
  end

  # authenticate's "You must sign in…" alert is set just before redirecting
  # here. These auth pages don't render flash, and without discarding it the
  # alert would carry through Clerk JS's client-side redirect and show on the
  # post-login page — confusing a user who just signed in successfully.
  def discard_stale_flash
    flash.discard
  end

  def safe_redirect_url(raw)
    return admin_path unless raw.is_a?(String) && raw.start_with?('/')
    # Reject scheme-relative or protocol-prefixed URLs ("//evil.com/x"
    # or "/javascript:..."). We only want same-origin paths.
    return admin_path if raw.match?(/\A\/\//) || raw.downcase.include?('javascript:')
    raw
  end
end
