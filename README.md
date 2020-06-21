# songbase
Song sheet database for psalms, hymns, and spiritual songs

## Getting Started

- `bundle install`
- `rake db:create`
- `rake db:migrate`
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
