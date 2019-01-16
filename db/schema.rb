# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20190115002234) do

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
    t.boolean "print_only", default: true
  end

  create_table "dead_songs", force: :cascade do |t|
    t.integer "song_id"
    t.bigint "user_id"
    t.index ["user_id"], name: "index_dead_songs_on_user_id"
  end

  create_table "song_books", id: :serial, force: :cascade do |t|
    t.integer "song_id"
    t.integer "book_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "index"
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
