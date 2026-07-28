class ApplicationController < ActionController::Base
  include Clerk::Authenticatable

  protect_from_forgery with: :exception
  helper_method :current_user, :authenticate, :super_admin, :all_languages,
                :clerk_sign_in_url, :clerk_sign_up_url, :clerk_sign_out_url,
                :clerk_publishable_key, :clerk_frontend_api_url

  def privacy
  end

  private

  def super_admin
    !!current_user&.super_admin?
  end

  # Redirect non-super-admins away from super-admin-only actions.
  def require_super_admin
    redirect_to admin_path, alert: "Super admin only" unless super_admin
  end

  def current_user
    return @current_user if defined?(@current_user)

    # Test env has no live Clerk session — synthesize a super-admin so
    # controller/system tests don't need to stub JWT cookies.
    @current_user = if Rails.env.test?
      User.test_user(:admin)
    elsif clerk&.user?
      User.from_clerk(clerk.user)
    end
  end

  def authenticate
    redirect_to clerk_sign_in_url, alert: "You must sign in to view that page" unless current_user
  end

  # Sign-in / sign-up / sign-out all point at our own embedded Clerk pages
  # (see ClerkAuthController) so the user stays on our domain through the
  # whole auth flow.
  def clerk_sign_in_url
    clerk_auth_url("/sign-in")
  end

  def clerk_sign_up_url
    clerk_auth_url("/sign-up")
  end

  def clerk_sign_out_url
    "/sign-out"
  end

  def clerk_publishable_key
    ENV['CLERK_PUBLISHABLE_KEY'].presence
  end

  # Frontend API URL for the current Clerk instance, decoded from the
  # publishable key. Used to build the Clerk JS script tags.
  def clerk_frontend_api_url
    pk = clerk_publishable_key
    return nil unless pk&.start_with?("pk_test_", "pk_live_")
    decoded = Clerk::Utils.decode_publishable_key(pk).chop
    # decoded is ASCII-8BIT; force UTF-8 and reject dummy/garbage keys (e.g.
    # the placeholder values used in the test env) whose bytes aren't valid
    # UTF-8, so the layout's Clerk JS block is skipped entirely.
    decoded = decoded.force_encoding("UTF-8")
    decoded.valid_encoding? ? decoded : nil
  rescue
    nil
  end

  def clerk_auth_url(base)
    return base unless request&.get? && request.original_url.present?
    # Strip Clerk's own handshake/redirect query params so we don't carry
    # a stale anonymous handshake JWT into the next redirect_url.
    clean = request.original_url.dup
    clean = clean.sub(/([?&])__clerk_handshake=[^&]*&?/, '\1')
    clean = clean.sub(/([?&])redirect_url=[^&]*&?/, '\1')
    clean = clean.sub(/[?&]$/, '')
    separator = base.include?('?') ? '&' : '?'
    "#{base}#{separator}redirect_url=#{CGI.escape(clean)}"
  end

  def check_maintenance
    redirect_to maintenance_path if ENV['maintenance_mode'] == 'true'
  end

  # Format changes for audit logging (used by song and book audits).
  # Converts Rails previous_changes format {attr => [old, new]}
  # to our audit format {attr => {'before' => old, 'after' => new}}.
  def format_changes_for_audit(changes)
    changes.transform_values do |old_and_new|
      { 'before' => old_and_new[0], 'after' => old_and_new[1] }
    end
  end
end
