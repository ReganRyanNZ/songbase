Rails.application.routes.draw do
  get 'auth/:provider/callback', to: 'sessions#create', as: 'create_session'
  get 'auth/failure', to: redirect('/admin')
  get 'signout', to: 'sessions#destroy', as: 'signout'

  get 'maintenance', to: 'sessions#maintenance_mode'
  get 'privacy', to: 'application#privacy'
  resources :songs, except: ["show"]
  get '/songs/:id', to: redirect('/%{id}')

  root to: 'songs#app'
  get '/books', to: 'songs#app'
  get '/:book/:s', to: 'songs#app', constraints: { s: /[i0-9]+/ }
  get 'edit', to: 'songs#edit' # shortcut when wanting to edit a song from main app
  get '/:s/e', to: 'songs#edit'
  get '/:s', to: 'songs#app', s: /[0-9]+/
  get 'admin', to: 'songs#admin'
  get 'admin/example', to: 'songs#admin_example'
  get 'taketime', to: 'take_time#take_time'
  get '/:s/print', to: 'songs#print', s: /[0-9]+/
  get '/:s/p', to: 'songs#print', s: /[0-9]+/

  namespace :api do
    namespace :v1 do
      get 'app_data', to: 'songs#app_data'
      get 'languages', to: 'songs#languages'
      get 'admin_songs', to: 'songs#admin_songs'
    end
  end

  namespace :api do
    namespace :v2 do
      get 'app_data', to: 'songs#app_data'
      get 'languages', to: 'songs#languages'
      get 'admin_songs', to: 'songs#admin_songs'
    end
  end
end
