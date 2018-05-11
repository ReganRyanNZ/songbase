# songbase
Song sheet database for psalms, hymns, and spiritual songs

## Getting Started

- `bundle install`
- `rake db:create`
- `rake db:migrate`
- `heroku pg:backups:download` to get 'latest.dump' (you'll need heroku access)
- `pg_restore --verbose --clean --no-acl --no-owner -h localhost -d songbase_development latest.dump` to load 'latest.dump' into dev db

## Product Design

### App
- Users can view lyrics and chords to songs
- Languages can be toggled
- Any site navigation is offline (after first visiting the site)
- Songs can be filtered by search or by book [future]
- From a song, users can click to relevant book indicies, or straight to related songs [future]

### Admin
- Users can log in via facebook [current] or google [future]