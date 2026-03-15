# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Songbase is a song sheet database for psalms, hymns, and spiritual songs. It's a Rails app with a React frontend, designed as a Progressive Web App (PWA) for offline-first usage.

- **Backend**: Ruby on Rails, Postgres, hosted on Heroku
- **Frontend**: React served via react-rails gem (not separate codebase)
- **Offline Storage**: Dexie (IndexedDB wrapper) for client-side song data caching
- **Auth**: Google OAuth via google_sign_in gem for admin users

## Common Commands

```bash
# Setup
bundle install
rails db:create
rails db:migrate
pg_restore --verbose --clean --no-acl --no-owner -h localhost -d songbase_development latest.dump

# Testing
rails test              # Run test suite
rails test:all         # Include system tests
rails test test/models/song_test.rb  # Run specific test file

# Server
rails server           # Start dev server

# Database refresh (superadmin only)
heroku pg:backups:capture
heroku pg:backups:download
```

## Architecture

### Data Models

**Song** (`app/models/song.rb`)
- Has `title`, `lyrics`, `lang` (language), `language_links` (array of song IDs)
- Soft deletes via `deleted_at` timestamp
- Songs are stored in books via jsonb field on Book model
- `language_links` is a many-to-many relationship stored as an array - reciprocal links are maintained via `reciprocate_language_links` callback
- Search works on both title and lyrics with regex wildcard matching (ignores chords, punctuation, whitespace)

**Book** (`app/models/book.rb`)
- Has `name`, `slug`, `languages` (array), `songs` (jsonb)
- `songs` format: `{song_id => index_in_book}` - e.g., `{"123" => "456"}`
- Soft deletes via `deleted_at` timestamp
- Hymnals are accessed via class methods like `Book.english_hymnal`, `Book.spanish_hymnal`

**Audit** - Tracks song edits with user and timestamp
**User** - Admin users authenticated via Google OAuth

### API Endpoints (`/api/v2/`)

- `GET /api/v2/app_data` - Full data sync (songs + books)
- `GET /api/v2/app_data?language=english` - Language-filtered sync
- `GET /api/v2/app_data?updated_at=1655130159689` - Incremental sync (returns only changes since timestamp)
- `GET /api/v2/languages` - List of all languages
- `GET /api/v2/admin_songs` - Admin song list with search
- `GET /api/v2/custom_book_search` - Custom book song search

Response format:
```json
{
  "songs": [...],
  "books": [...],
  "destroyed": {"songs": [1,2,3], "books": [4,5,6]},
  "songCount": 1234,
  "data_updated_between": [timestamp, timestamp]
}
```

### Frontend React Components (`app/assets/javascripts/components/`)

- **SongApp.jsx** - Main app container, handles routing via `AppNavigation` class and data sync via `DatabaseSetupAndSync` class
- **SongDisplay.jsx** - Renders lyrics with chord transposing - key for understanding raw song data format
- **SongIndex.jsx** - Song list with infinite scrolling
- **IndexOfBooks.jsx** - Book navigation
- **SongForm.jsx** - Admin song editing
- **AdminSongList.jsx** - Admin interface

### Routing (`config/routes.rb`)

Key routes:
- `root` → `songs#app` - Main React app (preloads data for SEO and instant load)
- `/books` → `songs#app` - Book index
- `/:book/:s` → `songs#app` - Song in book context (s = book index, not song ID)
- `/:s` → `songs#app` - Song by ID
- `/:s/print` or `/:s/p` → `songs#print` - Print view with chord layout
- `/admin` → `songs#admin` - Admin dashboard
- `/edit` or `/:s/e` → `songs#edit` - Edit song

## Important Patterns

### Language Linking
Songs can be linked across languages using the `language_links` array. When adding/removing links, use `song.add_language_link(other_song_id)` which handles reciprocal linking automatically.

### Book-Song Relationship
Unlike typical Rails associations, books contain songs via a jsonb hash. The pattern is:
```ruby
book.songs[song.id.to_s] = "123"  # Add song to book at index 123
book.save
```

### Song display Format
- Chords are embedded in lyrics: `[G]Amazing [C]grace`. The frontend handles rendering these as chord symbols above lyrics.
- Chorus lines are denoted by two leading spaces: `  Amazing grace`.
- Comments are lines starting with `#`. A comment with the pattern `# Capo \d` will turn into a button on the front end, to transpose the key.

### Print Format
The `Song#print_format` method converts lyrics with embedded chords to a tab-separated format suitable for copy-pasting into documents.

## Testing

- Uses Minitest (not RSpec)
- Factories in `test/factories/`
- System tests use Capybara + Selenium
- Run with `rails test` or `rails test:all` for system tests

## Deployment

- Hosted on Heroku
- PostgreSQL via Heroku add-on
- Uses rack-timeout to prevent long-running requests
- Gzip compression enabled via Rack::Deflater
