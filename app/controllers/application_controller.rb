class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  helper_method :current_user, :authenticate, :super_admin, :all_languages

  def privacy
  end

  private

  def super_admin
  [
    "regan.ryan.nz@gmail.com",
    "readjethro@gmail.com"
  ].include?(current_user&.email)
  end

  # Redirect non-super-admins away from super-admin-only actions.
  def require_super_admin
    redirect_to admin_path, alert: "Super admin only" unless super_admin
  end

  def current_user
    # @current_user ||= User.placeholder
    @current_user ||= User.test_user(:admin) if Rails.env.development? || Rails.env.test?
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
    @current_user
  end

  def authenticate
    redirect_to admin_path, alert: "You must sign in to edit songs" unless current_user
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
