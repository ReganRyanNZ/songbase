Rails.application.routes.draw do
  get 'maintenance', to: 'sessions#maintenance_mode'
  get 'privacy', to: 'application#privacy'

  # Embedded Clerk auth pages — must be declared before the catch-all
  # /:s and /:book/:s routes below.
  get '/sign-in',     to: 'clerk_auth#sign_in',     as: :sign_in
  get '/sign-in/*path', to: 'clerk_auth#sign_in'
  get '/sign-up',     to: 'clerk_auth#sign_up',     as: :sign_up
  get '/sign-up/*path', to: 'clerk_auth#sign_up'
  get '/sign-out',     to: 'clerk_auth#sign_out',   as: :sign_out
  get '/sign-out/*path', to: 'clerk_auth#sign_out'
  get '/oauth-consent', to: 'clerk_auth#oauth_consent', as: :oauth_consent
  get '/oauth-consent/*path', to: 'clerk_auth#oauth_consent'
  resources :songs, except: ["show"] do
    member { get :history; patch :restore; post :merge }
  end
  resources :books, only: [:new, :create, :edit, :update, :destroy] do
    member { patch :restore }
  end
  get '/songs/:id', to: redirect('/%{id}')

  root to: 'songs#app'
  get '/books', to: 'songs#app'
  get '/:book/:s', to: 'songs#app', constraints: { s: /[i0-9]+/ }

  get 'edit', to: 'songs#edit' # shortcut when wanting to edit a song from main app
  get '/:s/e', to: 'songs#edit', constraints: { s: /[0-9]+/ }
  get '/:book/e', to: 'books#edit_by_slug'
  get '/:s', to: 'songs#app', s: /[0-9]+/
  get 'admin', to: 'songs#admin'
  get 'admin/books', to: 'books#admin_index'
  get 'admin/books/activity', to: 'books#activity'
  get 'admin/cache', to: 'songs#cache'
  post 'admin/cache/reset', to: 'songs#reset_cache'
  get 'admin/trash', to: 'songs#trash'
  get 'admin/analytics', to: 'songs#analytics'
  get 'admin/example', to: 'songs#admin_example'
  get 'admin/example_with_tunes', to: 'songs#admin_example_with_tunes'
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
      get 'custom_book_search', to: 'songs#custom_book_search'
      get 'book_songs', to: 'songs#book_songs'
      post 'custom_book_import', to: 'songs#custom_book_import'
      post 'analytics', to: 'songs#record_analytics'
      get 'analytics', to: 'songs#analytics_summary'
    end
  end
end
