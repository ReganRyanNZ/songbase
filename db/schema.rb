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

ActiveRecord::Schema[7.1].define(version: 2024_02_29_170738) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_trgm"
  enable_extension "plpgsql"

  create_table "audits", id: :serial, force: :cascade do |t|
    t.integer "user_id"
    t.integer "song_id"
    t.datetime "time", precision: nil
    t.index ["song_id"], name: "index_audits_on_song_id"
    t.index ["user_id"], name: "index_audits_on_user_id"
  end

  create_table "books", id: :serial, force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "slug"
    t.datetime "deleted_at", precision: nil
    t.boolean "sync_to_all", default: false
    t.jsonb "songs"
    t.string "languages", array: true
  end

  create_table "songs", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.text "lyrics"
    t.string "lang", default: "en"
    t.string "title"
    t.string "last_editor"
    t.datetime "deleted_at", precision: nil
    t.integer "deleted_by"
    t.integer "language_links", default: [], array: true
    t.index ["title"], name: "index_songs_on_title", opclass: :gin_trgm_ops, using: :gin
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "provider"
    t.string "uid"
    t.string "name"
    t.string "email"
    t.string "oauth_token"
    t.datetime "oauth_expires_at", precision: nil
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  add_foreign_key "audits", "songs"
  add_foreign_key "audits", "users"
end
