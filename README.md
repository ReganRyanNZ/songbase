# songbase
Song sheet database for psalms, hymns, and spiritual songs

## Getting Started

You might need to install postgres, the easiest way is to download and run postgres.app. Follow the app's setup tutorial to install CLI tools as well.

- `bundle install`
- `rails db:create`
- `rails db:migrate`
- `heroku pg:backups:download` to get 'latest.dump' (you'll need heroku access)
- `pg_restore --verbose --clean --no-acl --no-owner -h localhost -d songbase_development latest.dump` to load 'latest.dump' into dev db

If you don't have heroku access, send an email to songbase.brothers@gmail.com to request a DB dump (I think the app won't run without data in the db).

## react-rails

This was first a Rails app, now it uses React to allow state management and offline navigation. Instead of maintaining two separate apps, the frontend and backend are (somewhat mashed) together in this project. The main difference is that React is served through a Rails gem, and importing/exporting JS components doesn't work like a regular React project.

## Product Goals
- Users can view lyrics and chords to songs
- Languages can be toggled
- Any site navigation is offline (after first visiting the site)
- Site navigation and search is instant
- Songs can be filtered by search or by book
- Backend users can log in via facebook or google
- Backend users can enter new songs and edit songs
- [Future] Backend users can CRUD custom songbooks (e.g. a songbook for a home meeting or conference)
- [Future] Backend users can export a songbook to a PDF for printing


# TODO

### Favorites

- move capo to a triple dot menu btn
- add a "+⭐" button to add a song to favs (and I guess a "-⭐" if it's a fav?)
- add a "⭐" book in the book index page, should be at the top
- "⭐" book should show all the device's favorited songs
- in the settings, there should be an "export ⭐" that gives a password for "import ⭐"

- in the books index, there should be an option to make a new book
- new books are not globally synced by default
- indexdb can keep a list of private books to sync
- in the books index, private books should have an option to remove
- in the books index, there should be an import function where you type the name of the book (autocomplete maybe?)
