class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  helper_method :current_user, :authenticate, :super_admin, :all_languages

  def privacy
  end

  private

  def super_admin
  [
    "regan.ryan.nz@gmail.com"
  ].include?(current_user&.email)
  end

  def current_user
    @current_user ||= User.placeholder
    @current_user ||= User.test_user if Rails.env.development?
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
    @current_user
  end

  def authenticate
    redirect_to admin_path, alert: "You must sign in to edit songs" unless current_user
  end

  def check_maintenance
    redirect_to maintenance_path if ENV['maintenance_mode'] == 'true'
  end
end
