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

  def book_admin(book)
     redirect_to admin_path, alert: "You must sign in / have permission to edit this book" unless (book.owner.include?(current_user)) || super_admin
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
end
