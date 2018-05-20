Rails.application.routes.draw do
  get 'auth/:provider/callback', to: 'sessions#create'
  get 'auth/failure', to: redirect('/admin')
  get 'signout', to: 'sessions#destroy', as: 'signout'

  get 'maintenance', to: 'sessions#maintenance_mode'

  get 'edit', to: 'songs#edit' # shortcut when wanting to edit a song from main app

  resources :songs
  root to: 'songs#app'
  get '/:s', to: 'songs#app'
  get 'admin', to: 'songs#admin'

  namespace :api do
    namespace :v1 do
      get 'songs', to: 'songs#all_songs'
      post 'create', to: 'songs#create'
    end
  end
end
