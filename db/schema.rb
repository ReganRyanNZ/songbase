# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_04_20_023124) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "audits", id: :serial, force: :cascade do |t|
    t.integer "user_id"
    t.integer "song_id"
    t.datetime "time"
    t.index ["song_id"], name: "index_audits_on_song_id"
    t.index ["user_id"], name: "index_audits_on_user_id"
  end

  create_table "books", id: :serial, force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "lang"
    t.string "slug"
    t.datetime "deleted_at"
    t.boolean "sync_to_all", default: false
  end

  create_table "dead_songs", force: :cascade do |t|
    t.integer "song_id"
    t.bigint "user_id"
    t.datetime "time"
    t.index ["user_id"], name: "index_dead_songs_on_user_id"
  end

  create_table "song_books", id: :serial, force: :cascade do |t|
    t.integer "song_id"
    t.integer "book_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "index"
    t.datetime "deleted_at"
    t.index ["book_id"], name: "index_song_books_on_book_id"
    t.index ["song_id"], name: "index_song_books_on_song_id"
  end

  create_table "songs", id: :serial, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "lyrics"
    t.string "lang", default: "en"
    t.string "firstline_title"
    t.string "chorus_title"
    t.string "custom_title"
    t.string "last_editor"
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "provider"
    t.string "uid"
    t.string "name"
    t.string "email"
    t.string "oauth_token"
    t.datetime "oauth_expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "audits", "songs"
  add_foreign_key "audits", "users"
  add_foreign_key "dead_songs", "users"
end
