# songbase
Song sheet database for psalms, hymns, and spiritual songs

## Getting Started

- `bundle install`
- `rake db:create`
- `rake db:migrate`
- `heroku pg:backups:download` to get 'latest.dump' (you'll need heroku access)
- `pg_restore --verbose --clean --no-acl --no-owner -h localhost -d songbase_development latest.dump` to load 'latest.dump' into dev db

If you don't have heroku access, send an email to songbase.brothers@gmail.com to request a DB dump (I think the app won't run without data in the db).

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
