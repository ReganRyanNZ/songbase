# songbase

Song sheet database for psalms, hymns, and spiritual songs

## Getting Started

You might need to install postgres, the easiest way is to download and run postgres.app. Follow the app's setup tutorial to install CLI tools as well. Ensure you have the correct versions before running these commands:

### Versions (or higher)
- Ruby: `Ruby 3.2.2`
- Rails: `Rails 7.1.3`
- Postgres: `16.9`
- Node.js: `v18.17.1`

- `bundle install`
- `rails db:create`
- `rails db:migrate`
- `pg_restore --verbose --clean --no-acl --no-owner -h localhost -d songbase_development latest.dump` to load 'latest.dump' into dev db. If the dump is old or not working, send an email to songbase.brothers@gmail.com to request an updated DB dump. Current dump version is 1.15 which requires postgres@16
- `rails s` or `rails server` to run the server before running tests
- `rails test` to run the test suite, `rails test:all` to include system tests


You may need to add your db credientals to `database.yml` eg:
``` 
default: &default
  adapter: postgresql
  encoding: unicode
  username: example <-
  password: root <-
  pool: 5
  timeout: 5000
```

_Note for superadmin: `heroku pg:backups:capture` and `heroku pg:backups:download` will refresh the dump._

## Backstory

If you want a bit of a backstory on songbase: I was in a high school church meeting one time, seeing some new ones from a very poor background. Someone was showing them isilo and trying to convince them to pay something like $20 for an app decades behind the times, just so they can get the song lyrics on their phone. It made me angry that there was such a high barrier. I also noticed that we produce new songbooks for the young people all the time—and within a year there are new songs they want to sing that aren't in those books. So we try adding to the back of them, or printing new books. Eventually with some help I created songbase with the following goals:

- Continually (and crowd-sourced) updated songs—even within a meeting I can fix a typo or add a new song.
- Fast. This should feel instant, not like scrolling a website.
- Completely distraction free. I love hymnal.net and the excerpts and comments and sound files and social media links, it's a great resource for studying the songs. But in meetings we found it a bit distracting for the saints, to finish a song but then start scrolling through the comments.

​There are a lot of other features, but these are the ones that I love.

## Using the API

A few people have reached out about making a similar project, but using the data from songbase. This is great! May we all find ways to help one another serve our God and His people. My best recommendation here is to use songbase's api, either directly from the client or at least regularly syncing to your db. Here are the endpoints:

- `https://songbase.life/api/v2/app_data` grabs all the data for songs and songbooks, this might be good for a giant refresh.
  ​- `https://songbase.life/api/v2/languages` gets a list of all the languages in the db.
- `https://songbase.life/api/v2/app_data?language=english` grabs all the data only for english songs (and so on for each language)​. If you get the languages first, and then fetch each language at the same time, you can download everything much faster, and have some songs loading before everything has finished.
- ​`https://songbase.life/api/v2/app_data?updated_at=1655130159689` gets a list of data--but only what has changed after the `updated_at` timestamp. Songbase sends this with `updated_at` being the result of `new Date().getTime()` (in JS) to only get new data, instead of redownloading the entire db every time you load the site. This is pretty important if the client is fetching the API, since the full download will be several mb in size.

If you are interested in the api for creating your own software, I would recommend checking out `app/assets/javascripts/components/SongDisplay.jsx` to see how the raw song data is converted to html (chord transposing is also there).

## react-rails

This was first a Rails app, now it uses React to allow state management and offline navigation. Instead of maintaining two separate apps, the frontend and backend are (somewhat mashed) together in this project. The main difference is that React is served through a Rails gem, and importing/exporting JS components doesn't work like a regular React project.

## Devops/architecture stack

- This is a Ruby on Rails site, the server runs ruby
- The front end is mostly React, served by the Rails server (not a separate code-base)
- PWA configuration means the front end runs disconnected from the server, only pinging for data sync updates on page reload.
- The Rails server is hosted on Heroku
- The database is Postgres, hosted on aws via Heroku add-on

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
- PWA app :) this website is now installable from the browser as a standalone app.
- Alternate tunes/versions can be added to the same song

# TODO

### Short-term TODO
- Clicking a language link at bottom of song should append that song to the view, not navigate.
  - Which link is opened should be cached, so the user can always see the double up when they visit that song.
  - It should also be in the url so someone can set up the languages then share with others.
- Share symbol should be updated to match iOS
- Book CRUD interface. Book search and select to sync to device.
- Linking languages is so clunky at the moment
  - Linking a new language in should link all the currently-linked songs to that new song
  - Edit page should show the existing links with the "language: first line" format so it's obvious which link is which
  - There should be a way to add a new song, instead of editing the CSV field. At least just adding an id to an input, and have an 'x' for existing links.

### Song moderation
- [done]Email diff to moderators whenever a song is edited
- Show who did the edit
- New songs should also trigger the email
- Spanish song moderators?

### books
- Different categories of books
  1. Hymnals
    - Available to everyone by default, non-deletable
    - Super-admin can edit, through code lol but also make sure they have access to everything
  2. Wide-reaching books
    - E.g. Blue songbook, NACT book, Canada YP songbook, Spanish/German YP books
    - Should be accessible by everyone, but not necessarily in the book list by default
    - Might divide this by dated vs timeless (e.g. a conference vs bsb)
    - List of email addresses for who can edit each book
  3. Small group books
    - Home meeting
    - Hamilton highschoolers
    - Besties having a shared favourites book
    - List of email addresses for who can edit each book
  4. Personal books
    - E.g. favs, or maybe someone does a collection on a topic or something for study
    - Technically doesn't need to be shared/synced/in the db, BUT the person might have multiple devices
    - List of email addresses for who can edit each book (even if just 1 email)

Concluding thoughts:
- What if all books are publicly searchable, but only after moderator confirmation
- When publishing a book, or editing title of a published book, let the user know that it wont be public until a moderator approves.
- Sort books (when searching for new books) by how many people are syncing the book, so that all the good conferences etc come up to the top
- A checkbox to say "publish" (or "public"), until then it's not searchable.
  - This makes it hard to access on multiple devices, but maybe saving can send all owners (that are new for that save, or all owners when changing to "public") an email with an edit link "you've been made owner of SONGOBOOK click here to edit".
- Also saving updates could let owners know? Maybe? Like diffs.

Pages:
- Book index
  - Searchable index of books to add
    - Hidden by default, a button opens up the searchbar/list
  - Edit button/icon somewhere for books you can edit
  - Bottom of page shows "register email to edit books" button (wording can be improved)
    - Button changes to just your email once registered (with a signout button)
- Book form
  - Book title
    - On submit, create the slug by subbing out any whitespace for underscore or hyphen or something (/\S+/, "_")
    - Validate both title and slug are unique, otherwise put an error on title (might need something fancy to check uniqueness on the spot instead of waiting for submit? Not a blocker, could just do it on submit)
  - Book index stuff to create the book
  - Email addresses for editors (CSV format)
  - Hidden field with salt for registered device
- Email for registering device
- Email for moderators to approve new book/title
- Email for book diff sent to owners on edit
- Email for new owners added

Auth idea:
Register email to edit books
-> regan.ryan.nz@gmail.com
-> I get an email with a link, I click the link
-> device stores 1423jhkbj12bkjhwqerfbhdjqwehiu
-> Whenever you submit an edit form from that device, a hidden field will include 1423jhkbj12bkjhwqerfbhdjqwehiu so the server knows you are regan.ryan.nz@gmail.com, same as detecting whether you can see the edit button.
"register" as a word because it's permanent, rather than "log in" but really it's the same thing except you dont make up a password nor sign up

### Book printing

- [done] First stage is to get a single song with chords in a copy-paste format.
- Second stage is to get the whole book as back-to-back copy-paste songs. This is probably the best state because people still want to edit and move things around.

### Better analytics

- If a user stays on a song for more than 30 seconds, add to list of sung songs. Periodically sync that list with the server so we have records of what songs are sung.
- This is useful to know which songs are popular, e.g. for camp songbooks
- Homepage could be a list of popular songs, instead of all songs starting with A
- Also useful to see orphaned songs, that are no longer sung and are just clutter
- Build a hash of {song_id: sing_count} to add to next sync. Controller can add those counts to songs (will that ddos the server with too many db calls?). Timestamps and things can be left to statcounter, but at least we can have a running total (or should we bump in a new column every year or something? probs not)
- We don't want to update a song with a count, that would cause too much data to update every time the client syncs. We'll need some kind of analytics table, probably with a jsonb hash of song_id => count, and some fancy syncing that goes "after 30s tell the server I sang this song, otherwise store it in a list to send the next time I sing a song"

New notes:
- Create hash of analytics data on client, send every now and then according to connectivity
- On the server side, store 1 record per song to get fine-grained info
- This is 10k records per day
- After 7 days, those records can be reduced to e.g. an array of month totals on the song record, then the individual records deleted
- This will keep the db to ~70-100k records for analytics, never going beyond that, while keeping a huge amount of accurate data

### Columns/Split screen

- Turn hamburger icon into a dialog open button
- Show treb clef with staff icon with a radio toggle for showChords (disable radio greyed out if no chords)
- Show a one col icon arrow to two cols icon, then a minus, value, plus control set like we have for capo.
- Put capo controls here, we'll need an icon. (but it's nice to see the chords change, so you can really feel like spiderman) (mayybe)
- [Big One]Rewrite the entire lyrics formatting algorithm, so that we can wrap stanzas and choruses into divs, and force breaks on them so it doesn't break a div in half for columns.
- Remove margin/width stuff from most containers, references may need to be treated differently
- Move song controls outside of the lyrics div
- Set columns: 2 auto; column-gap: 40px; to .lyrics, where 2 is probably going to be an inline style set by js when the controls are clicked
- IDEA: instead of manually setting number of cols, just have on/off. When on, increment the number of cols until the height of the text is less than the (100vh - whatever is above the lyrics div). I think we can js to find the hegiht of the div using element.offsetHeight

### Copyright fellowship

- General disclaimer/statement
- Copyright button that pops up with more information?

### Book navigation via sideswiping

- Would be cool to swipe horizontally to move between songs in a book
- Can use scroll snapping to center on the next song
- Might have issues with native phone behaviour of going backwards when swiping left..

### Debounce admin API call

- Put a lil d'bounce while admin is typing in search, so we don't fire 7 calls while she/he be typin'

### History on the front page

- Record "visited" songs (not 30s, just opened), update it with the 30s timer to count as sung
- Put a history icon on index, perhaps next to book icon, that toggles page to list of songs in order of recently opened

### Home and book navigation overlap

- If pressing the home button takes a second, the user might press it twice... and end up in the book selection page. We should block the book navigation for ~500ms after pressing the home navigation

### PWA stops admin working

- The login/Oauth system redirect tries to open the app instead of the browser

### When clicking into a song's book index, highlight the song in the index

- Currently it scrolls to have the song in the middle, but that's difficult to see/understand in the wall of titles.

### Book index toggle overlapping search

- Small screens like iphone SE
- When in a book, the toggler between alphabet and index overlaps the search.
- Could be solved by a media query for screen length, then reducing sizae or maybe shifting search to be left aligned.
- Only needs to be when inside a book, when that toggle isn't there, it's nice to have the big search bar.

### Background sync updates

- Currently index takes longer to load when on internet compared to offline even if cached
- Look to load from cache, and then background sync outdated songs onto state on state(page) change