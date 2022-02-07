class SessionsController < ApplicationController
  def create
    user = User.from_google(flash[:google_sign_in]["id_token"])
    session[:user_id] = user.id
    redirect_to admin_path
  end

  def destroy
    session[:user_id] = nil
    redirect_to admin_path
  end

  def maintenance_mode
  end
end