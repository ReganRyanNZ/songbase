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

## Backstory

If you want a bit of a backstory on songbase: I was in a high school church meeting one time, seeing some new ones from a very poor background. Someone was showing them isilo and trying to convince them to pay something like $20 for an app decades behind the times, just so they can get the song lyrics on their phone. It made me angry that there was such a high barrier. I also noticed that we produce new songbooks for the young people all the time—and within a year there are new songs they want to sing that aren't in those books. So we try adding to the back of them, or printing new books. Eventually with some help I created songbase with the following goals:

- Continually (and crowd-sourced) updated songs—even within a meeting I can fix a typo or add a new song.
- Fast. This should feel instant, not like scrolling a website.
- Completely distraction free. I love hymnal.net and the excerpts and comments and sound files and social media links, it's a great resource for studying the songs. But in meetings we found it a bit distracting for the saints, to finish a song but then start scrolling through the comments.

​There are a lot of other features, but these are the ones that I love.

## Using the API

A few people have reached out about making a similar project, but using the data from songbase. This is great! May we all find ways to help one another serve our God and His people. My best recommendation here is to use songbase's api, either directly from the client or at least regularly syncing to your db. Here are the endpoints:

- `https://songbase.life/api/v1/app_data` grabs all the data for songs and songbooks, this might be good for a giant refresh.
  ​- `https://songbase.life/api/v1/languages` gets a list of all the languages in the db.
- `https://songbase.life/api/v1/app_data?language=english` grabs all the data only for english songs (and so on for each language)​. If you get the languages first, and then fetch each language at the same time, you can download everything much faster, and have some songs loading before everything has finished.
- ​`https://songbase.life/api/v1/app_data?updated_at=1655130159689` gets a list of data--but only what has changed after the `updated_at` timestamp. Songbase sends this with `updated_at` being the result of `new Date().getTime()` (in JS) to only get new data, instead of redownloading the entire db every time you load the site. This is pretty important if the client is fetching the API, since the full download will be several mb in size.

If you are interested in the api for creating your own software, I would recommend checking out `app/assets/javascripts/components/SongDisplay.jsx` to see how the raw song data is converted to html (and transposing is also there).

## react-rails

This was first a Rails app, now it uses React to allow state management and offline navigation. Instead of maintaining two separate apps, the frontend and backend are (somewhat mashed) together in this project. The main difference is that React is served through a Rails gem, and importing/exporting JS components doesn't work like a regular React project.

## Features

- Users can view lyrics and chords to songs
- Languages can be toggled
- Any song/book navigation is offline (after first visiting the site)
- Site navigation and search is instant
- Songs can be filtered by search or by book
- Within a book, index can be sorted by title or by index number
- Search lyrics as well as first line
- Backend users can log in via google
- Backend users can enter new songs and edit songs
- Infinite scrolling to speed up search loading.
- References at the end of a song bring the user to the index of that book
- Fully offline! After initial load, clients should be able to later load songbase even without internet connection (it's patchy, confirmed working on chrome for android)

# TODO

### System tests

- [done]App
- [done]Admin
- [done]Example

### Styling

- [done]Settings buttons should lift up a lil on hover, or maybe just have a shadow in general

### CRUD books

Notes from 17 Aug 2023:

- song_books joins table will get too big (10k books, each with 100 songs, = 1 million rows), so we need to restructure the books db setup:
  - Book records will have a single column with all song references, probably as a JSON encoded hash
  - Postgres's text type can have infinite length (woo!) UPDATE postgres is way better than I realised. It has jsonb which stores json in an indexible way, and arrays, so I can use faster queries than wildcards to search for books with a particular language.
  - On the frontend, we can explore whether we can store it the same, or whether to unpack to the current references structure after fetch #TODO
  - merge! and song deletion needs to be updated and tested that book indices would change
- Sync should be simpler, just replace any book that has been updated later than the last sync date
  - Languages for books are still needed, but should be multi-choice, and stored as CSV in the db, with a LIKE query to fetch the right books
- Books need a csv field of email addresses allowed to edit the song. Users need to log in via gmail, and then their email is checked against this value. This feels like the best compromise between avoiding user signup and privilege-based access.
- Creating/editing books is still a question of UI
- Add link icon in book index to get shareable link
  - Book's index url should also be a shareable link
- Song form should not use Book.app_data, find a better way to query references
- IDEA:
  - Books are created locally
  - When a share link is clicked, the booked is synced to server
  - After 1 month, book is taken down? Nah but if it's just one record, seems fine to keep up.. What about 10k useless lost user books? Hmm maybe after 6 months of no updating, remove it? Seems like a task for 6 months later...

Steps:

- [done]Create new field in books
- [done]Migrate data from song_books to books
- [done]Figure out whether client needs to parse books back to references or just change its ways (done, I want to change ways)
- [done]Keep v1 api but only returning song data
- [done]Build v2 separate
  - [done]Create v2 controller, with tests
  - [done]SongApp to ping new api endpoint, and use the new data structure
  - [done]Admin side to use new controller, create tests
  - Email people about v2 when its in prod
- [done]Test preloaded props songs and books are working
- Remove song_books from db and code
- General refactor
- Shareable link
  - e.g. songbase.life/add_book?id=4123&name=wellington-yp-2023, where name is there for visual reference but discarded so changing names doesn't break the link
  - Link needs to be easily accessed, perhaps in book selection page?
  - A song url that includes a book in the path should add the book
- Add array (or string?) of email addresses to book records. Users can log in via google, and their email matched to give access to edit that particular book.
- Remove blue songbook from defaults, but keep hymnals
- Add some kind of note to book selection page that if a book is missing, they need someone to share with them, or to perhaps check languages in the settings.
- Book creation page
- Book login page, separate from admin because we don't need all users knowing about admin
- How to add songs to a book? Better to not clog up the song display, perhaps in the book edit page we can just have a searchable index, clicking brings to another panel, with draggable titles for ordering?
- Remove book button
- Logging in should sync books saved to that user('s record in db) to the client by default.
- Logging in should save email address into indexedDB, so logging in is not required again
- Creating a book should have "My Favorites" as the default name

### Book printing

- [done] First stage is to get a single song with chords in a copy-paste format.
- Second stage is to get the whole book as back-to-back copy-paste songs. This is probably the best state because people still want to edit and move things around.

### Duplicates

- Exact duplicates will no longer be created (by some previous double-submitting bug). Near duplicates (e.g. one version without chords, one with) are tricky to catch. The best solution I can think of is to use Postgres's Levenshtein function to match string similarity, but that has a 255 byte max, so we'd need to combine it with a LEFT function to get the first 60 characters (assuming the worst case is all characters are 4 bytes), and possibly some kind of regex to remove chords from the comparison. Would be cool, but it's technically challenging enough that manual finding/fixing is sufficient for now.
- What if I strip lyrics of all chords and non-chars, downcase, then compare the first 100 chars? Would have to be a script, because it's O(n^2).
- Improve language code so we don't have duplicate languages stored

### Loading bar

- Loading bar to show progress when syncing, so it doesn't just look stuck

### Related songs linking

- Along with links to book indices, we also want links to e.g. same song in another language, or commonly joined songs (e.g. Therefore with joy + drinking at the fountain)
- Will need a script to create all the hymnal language links
- This can be an array of song ids stored in each song record. The client can fetch the title/firstline for the link

### Tabs for alternate versions/tunes

- Instead of using different verses for different tunes, make a separate tab for each tune or version
- This lets us modify song structure/add bonus verses without messing with the original etc
- Client should remember which tab was last used so after the first time switching it's automatically on their preferred version

Examples (non-exhaustive) where a separate tune forces line-repeats, or chorus is written out a second time:
507 Re[D]move my covering, Lord
627 My goal is God Himself

Id's of all songs with "tune" in the lyrics:
[2168, 752, 478, 433, 439, 507, 514, 626, 627, 631, 719, 624, 515, 751, 1105, 1595, 520, 2129, 1603, 782, 1613, 957, 1512, 1457, 168, 336, 899, 3970, 1334, 345, 1307, 539, 352, 531, 549, 1305, 318, 524, 453, 2018, 1926, 398, 567, 2045, 46, 4325, 4277, 1608]

### Better analytics

- If a user stays on a song for more than 30 seconds, add to list of sung songs. Periodically sync that list with the server so we have records of what songs are sung.
- This is useful to know which songs are popular, e.g. for camp songbooks
- Homepage could be a list of popular songs, instead of all songs starting with A
- Also useful to see orphaned songs, that are no longer sung and are just clutter
- Build a hash of {song_id: sing_count} to add to next sync. Controller can add those counts to songs (will that ddos the server with too many db calls?). Timestamps and things can be left to statcounter, but at least we can have a running total (or should we bump in a new column every year or something? probs not)
- We don't want to update a song with a count, that would cause too much data to update every time the client syncs. We'll need some kind of analytics table, probably with a jsonb hash of song_id => count, and some fancy syncing that goes "after 30s tell the server I sang this song, otherwise store it in a list to send the next time I sing a song"

### Columns/Split screen

- If the screen is wide enough, button appears to add a column with the same lyrics. Not sure how capo might break things

### Capo comment should have pointer cursor

### Admin should search hymnal indices and song ids

### Better choice of keys

- Breathe thou on edit, E should have sharps not flats. Some keys would look more familiar as the flat version instead of the sharp.
