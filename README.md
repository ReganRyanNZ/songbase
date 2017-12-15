# songbase
Song sheet database for psalms, hymns, and spiritual songs

## Getting Started

- `bundle install`
- `rake db:create`
- `rake db:migrate`
- `rake import:songs["songs_master"]`
- `heroku pg:backups:download` to get 'latest.dump', then add that to db for prod seed
- `rake export:songs` to get a folder of .song files