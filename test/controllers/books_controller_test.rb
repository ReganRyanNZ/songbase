require 'test_helper'

class BooksControllerTest < ActionDispatch::IntegrationTest
  # books#create/update are CSRF-protected; disable forgery protection in tests
  # so we can POST book params directly without a token, and restore it after.
  setup { ActionController::Base.allow_forgery_protection = false }
  teardown { ActionController::Base.allow_forgery_protection = true }

  test 'new offers duplicatable books' do
    FactoryBot.create(:book, name: 'Public Hymnal', sync_to_all: true)
    FactoryBot.create(:book, name: 'Private Book', sync_to_all: false)

    get new_book_path
    assert_response :success
    # super_admin test user => every book is duplicatable
    assert_match(/Public Hymnal/, response.body)
    assert_match(/Private Book/, response.body)
  end

  test 'new with from= copies source songs and surfaces duplicateFromId' do
    song = FactoryBot.create(:song, :abba_father) # "Abba, Father"
    source = FactoryBot.create(:book, name: 'Hymnal', sync_to_all: true,
                               songs: { song.id => '1' }, languages: ['english'])

    get new_book_path, params: { from: source.id }
    assert_response :success
    assert_match(/Hymnal \(copy\)/, response.body)
    # book.songs hash (inlined into react_component props) carries the source song id.
    # react-rails HTML-escapes the JSON attribute, so quotes appear as &quot;.
    assert_match(/&quot;#{song.id}&quot;:&quot;1&quot;/, response.body)
    # the source id is passed as a prop so the builder can fetch display data
    assert_match(/duplicateFromId.{0,10}#{source.id}/, response.body)
  end

  test 'edit surfaces the persisted book for the client fetch' do
    song = FactoryBot.create(:song, :abba_father) # "Abba, Father"
    book = FactoryBot.create(:book, name: 'Edit Me', songs: { song.id => '1' }, languages: ['english'])

    get edit_book_path(book, edit_token: book.edit_token)
    assert_response :success
    assert_match(/&quot;isPersisted&quot;:true/, response.body)
    assert_match(/&quot;#{song.id}&quot;:&quot;1&quot;/, response.body)
  end

  test 'new with from= ignores a missing source book' do
    get new_book_path, params: { from: 999_999 }
    assert_response :success
    refute_match(/\(copy\)/, response.body)
  end

  test 'new with from= ignores a private book for non-super-admin' do
    original = ApplicationController.instance_method(:super_admin)
    ApplicationController.define_method(:super_admin) { false }
    begin
      private_book = FactoryBot.create(:book, name: 'Secret', sync_to_all: false)
      get new_book_path, params: { from: private_book.id }
      assert_response :success
      refute_match(/Secret \(copy\)/, response.body)
    ensure
      ApplicationController.define_method(:super_admin, original)
    end
  end

  test 'create persists the email field' do
    song = FactoryBot.create(:song, :abba_father)
    post books_path, params: {
      book: {
        name: 'My Book',
        email: 'author@example.com',
        songs: { song.id.to_s => '1' }.to_json,
        languages: ['english'].to_json
      }
    }
    assert_response :redirect
    book = Book.find_by(name: 'My Book')
    assert_not_nil book
    assert_equal 'author@example.com', book.email
    assert_equal({ song.id.to_s => '1' }, book.songs)
  end

  test 'create enqueues a book email when an email is provided' do
    song = FactoryBot.create(:song, :abba_father)
    assert_enqueued_emails(1) do
      post books_path, params: {
        book: {
          name: 'With Email',
          email: 'author@example.com',
          songs: { song.id.to_s => '1' }.to_json,
          languages: ['english'].to_json
        }
      }
    end
    assert_response :redirect
  end

  test 'create does not enqueue an email when no email is provided' do
    song = FactoryBot.create(:song, :abba_father)
    assert_enqueued_emails(0) do
      post books_path, params: {
        book: {
          name: 'No Email',
          email: '',
          songs: { song.id.to_s => '1' }.to_json,
          languages: ['english'].to_json
        }
      }
    end
    assert_response :redirect
  end

  private

  def response_json
    JSON.parse(response.body, symbolize_names: true)
  end
end
