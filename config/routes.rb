Rails.application.routes.draw do
  resources :songs

  root to: 'songs#index'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  namespace :api do
    namespace :v1 do
      get 'songs', to: 'songs#all_songs'
      post 'create', to: 'songs#create'
    end
  end
end
