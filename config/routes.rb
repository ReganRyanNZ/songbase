Rails.application.routes.draw do
  resources :songs

  root to: 'songs#app'

  get 'admin', to: 'songs#admin'

  namespace :api do
    namespace :v1 do
      get 'songs', to: 'songs#all_songs'
      post 'create', to: 'songs#create'
    end
  end
end
