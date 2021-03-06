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

## Features
- Users can view lyrics and chords to songs
- Languages can be toggled
- Any song/book navigation is offline (after first visiting the site)
- Site navigation and search is instant
- Songs can be filtered by search or by book
- Within a book, index can be sorted by title or by index number
- Search looks at lyrics as well as first line
- Backend users can log in via facebook or google
- Backend users can enter new songs and edit songs
- Infinite scrolling to speed up search loading.


# TODO

### References to books for each song

- At the bottom of the song put all its references.
- Each reference is a link to that book's index.
- Index needs to be sorted by index number.

### CRUD books

- Add a local book by default called "My Favorites"
- At the bottom of songs, where the book refs are, add a "+ [book name]" for every local-owned book
- At the bottom of the books page, add a "+" that shows an input and submit to make a local book (maybe an HR can separate this from the list of references, and another to separate the song).
- Local books need a delete btn on the index page, and an "export" button that gives a url for others to import. Delete and export could be under a burger menu.
- Local books are not globally synced.
- Local books should be uniquely named, and importing a dup name should ask if you want to delete the previous (i..e a kind of simple override to simulate updating)

### Book printing

- First stage is to get a single song with chords in a copy-paste format.
- Second stage is to get the whole book as back-to-back copy-paste songs. This is probably the best state because people still want to edit and move things around.