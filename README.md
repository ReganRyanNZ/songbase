# songbase
Song sheet database for psalms, hymns, and spiritual songs

## Getting Started

- `bundle install`
- `rake db:create`
- `rake db:migrate`
- `rake import:songs["songs_master"]`
- `heroku pg:backups:download` to get 'latest.dump'
- `pg_restore --verbose --clean --no-acl --no-owner -h localhost -U regan -d songbase_development latest.dump` to load 'latest.dump' into dev db (change 'regan' to your pg user)
- `rake export:songs` to get a folder of .song files