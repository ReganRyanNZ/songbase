class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  helper_method :current_user, :authenticate, :super_admin, :all_languages

  private

  def super_admin
  [
    "regan.ryan.nz@gmail.com"
  ].include?(current_user&.email)
  end

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

  def authenticate
    redirect_to admin_path, alert: "You must sign in to edit songs" unless current_user
  end

  def check_maintenance
    redirect_to maintenance_path if ENV['maintenance_mode'] == 'true'
  end

  def all_languages
    Song.distinct.pluck :lang
  end
end
