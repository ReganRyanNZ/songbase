class SongApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: props.song_id || "index",
      settings: {
        // default settings, these will be overridden if db settings are found
        settingsType: "global",
        languages: ["english"],
        languagesInfo: [],
        updated_at: 0,
        cssTheme: 'css-normal'
      },
      totalSongsCached: 0,
      bookSlug: props.book_slug,
      currentBook: props.preloaded_current_book || null,
      songs: [],
      references: props.preloaded_references || [],
      books: props.preloaded_books || [],
      loadingData: false,
      search: "",
      orderIndexBy: 'alpha',
      scrollTo: null,
      rowLimit: 100,
      logSyncData: false
    };

    // bind all methods to this context (so we can use them)
    this.pushDBToState = this.pushDBToState.bind(this);
    this.resetCache = this.resetCache.bind(this);
    this.setSettings = this.setSettings.bind(this);
    this.toggleSettingsPage = this.toggleSettingsPage.bind(this);
    this.toggleBookIndex = this.toggleBookIndex.bind(this);
    this.clearBook = this.clearBook.bind(this);
    this.setSong = this.setSong.bind(this);
    this.setSongFromHistory = this.setSongFromHistory.bind(this);
    this.getSong = this.getSong.bind(this);
    this.returnToIndex = this.returnToIndex.bind(this);
    this.setSearch = this.setSearch.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.toggleOrderIndexBy = this.toggleOrderIndexBy.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.goToBookIndex = this.goToBookIndex.bind(this);
    this.scrollToSong = this.scrollToSong.bind(this);
    this.infiniteScrolling = this.infiniteScrolling.bind(this);

    // setup history so users can navigate via browser
    window.history.replaceState({ page: this.state.page, currentBook: this.state.currentBook }, "", window.location.pathname);
    this.initializeDB();
  }

  // when user clicks "back" in their browser, navigate to previous song
  componentDidMount() {
    window.addEventListener("popstate", this.setSongFromHistory);
  }

  componentDidUpdate() {
    if(!!this.state.scrollTo && this.state.page == 'index') {
      var element = document.getElementById(this.state.scrollTo);
      if(element) {
        element.scrollIntoView({ block: 'center'});
      }
      this.setState({scrollTo: null});
    }
  }

  infiniteScrolling(){
    var pixelsBeforeTheEnd = 500,
        currentScrollPoint = window.innerHeight + document.documentElement.scrollTop,
        maxScrollPoint = document.scrollingElement.scrollHeight;
    if (pixelsBeforeTheEnd + currentScrollPoint > maxScrollPoint) {
        this.setState({rowLimit: this.state.rowLimit + 100});
    }
  }

  initializeDB() {
    var app = this;
    app.db = new Dexie("songbaseDB");

    // Change version number when db structure changes
    // Note that stores() specifies primary key, then *indexed* properties,
    // there may be more properties than specified here, these are just indexed ones.
    // NOTE I somewhat screwed up some versioning, that's why several versions are the same.
    app.db.version(1).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });
    app.db.version(2).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });
    app.db.version(3).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });
    app.db.version(4).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });

    // initialize settings, set defaults if settings doesn't exist
    app.db.settings
      .get({ settingsType: "global" })
      .then(result => {
        if (result) {
          if(app.state.logSyncData) { console.log("Settings via IndexedDB detected."); }
          app.setState({ settings: result });
        } else {
          if(app.state.logSyncData) { console.log("No settings found. Creating defaults..."); }
          app.db.settings.add(app.state.settings);
        }
      })
      .then(app.pushDBToState)
      .then(function(response) {
        if(app.state.logSyncData) { console.log("Fetching data from api..."); }
        app.fetchData();
      }).catch((e) => {
        if(app.state.logSyncData) { console.log("Failed to fetch new data.", e); }
      });
  }

  fetchData() {
    // fetch a list of languages
    // sort the list so languages in settings are first
    // for each language, fetch and update db
    var app = this;
    var db = app.db;
    var lastUpdatedAt = app.state.settings.updated_at || "";
    var newUpdateTime = new Date().getTime();

    axios({
      method: "GET",
      url: "/api/v1/languages",
      headers: {
        "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content
      }
    }).then(function(response) {
      var myLanguages = app.state.settings.languages;
      var hiddenLanguages = response.data.languages.filter(lang => !myLanguages.includes(lang));
      var languages = myLanguages.concat(hiddenLanguages);

      if(app.state.logSyncData) { console.log('myLanguages: ' + myLanguages); }
      if(app.state.logSyncData) { console.log('hiddenLanguages: ' + hiddenLanguages); }

      languages.forEach((language) => {
        app.fetchDataByLanguage(app, db, language, lastUpdatedAt)
      })
    }).then(function() {
      db.transaction(
        "rw",
        db.settings,
        () => {
          var settings = app.state.settings;
          settings["updated_at"] = newUpdateTime;
          app.setState({
            settings: settings
          });
          db.settings.put(settings);
        }
      )
  });
    if(app.state.logSyncData) { console.log("Fetch completed."); }
  }

  fetchDataByLanguage(app, db, language, lastUpdatedAt) {
    if(app.state.logSyncData) { console.log(
      "Fetching " + language + " songs"
    );}
    axios({
      method: "GET",
      url: "/api/v1/app_data",
      params: {
        updated_at: lastUpdatedAt,
        language: language
      },
      headers: {
        "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content
      }
    })
    .then(function(response) {
      if(app.state.logSyncData) { console.log(
        "Syncing " + response.data.songs.length + " " + language + " songs with indexedDB..."
      );}
      // run this all in a transaction, to stop mid-sync cut outs from wrecking everything.
      // if I'm fetching by language, things could still break if there's a song or book referring to multiple languages
      // I guess we'll see...
      db.transaction(
        "rw",
        db.songs,
        db.books,
        db.references,
        db.settings,
        () => {
          db.songs.bulkPut(response.data.songs);
          db.references.bulkPut(response.data.references);
          db.books.bulkPut(response.data.books);
          db.songs.bulkDelete(response.data.destroyed.songs);
          db.references.bulkDelete(response.data.destroyed.references);
          db.books.bulkDelete(response.data.destroyed.books);

          var settings = app.state.settings;
          settings['languagesInfo'] = settings['languagesInfo'].filter(info => info[0] != language); // remove previous value
          settings['languagesInfo'].push([language, response.data.songCount]); // add new value
          app.setState({
            settings: settings
          });
          db.settings.put(settings);
        }
      );
    })
    .then(function(data) {
      if(app.state.logSyncData) { console.log("Syncing " + language + " completed."); }
      app.pushDBToState();
    });
  }

  pushDBToState() {
    if(this.state.logSyncData) { console.log("Fetching songs from offline storage..."); }
    var app = this;
    var db = app.db;
    var langs = app.state.settings.languages;
    db.books
      .where("lang")
      .anyOf(langs)
      .toArray(books => {
        app.setState({ books: books });
        return books;
      })
      .then(books => {
        var book_ids = books.map(book => {
          return book.id;
        });
        db.references
          .where("book_id")
          .anyOf(book_ids)
          .toArray(references => {
            app.setState({ references: references });
          });
      })
      .then(() => {
        db.songs
          .where("lang")
          .anyOf(langs)
          .toArray(songs => {
            songs.sort((a, b) => {
              var title = str => {
                return str.title.toUpperCase().replace(/[^A-Z]/g, "");
              };
              var titleA = title(a);
              var titleB = title(b);
              if (titleA > titleB) {
                return 1;
              } else if (titleA < titleB) {
                return -1;
              } else {
                return 0;
              }
            });
            app.setState({ songs: songs, loadingData: songs.length == 0 });
            if(app.state.logSyncData) { console.log("Fetching complete."); }
          });
      })
      .then(result => {
        if(app.props.book_slug && app.state.books.length > 0) {
          app.setState({
            currentBook: app.state.books.find(book => book.slug === app.props.book_slug)
          })
        }
      })
      .then(result => {
        db.songs.count(songCount => { app.setState({totalSongsCached: songCount}) });
      });
  }

  // reset updated timestamp, wipe db tables, then call fetch
  resetCache() {
    var settings = this.state.settings,
        db = this.db,
        app = this;

    settings.updated_at = 0;
    settings.languagesInfo = [];
    this.setState({settings: settings, totalSongsCached: 0});

    db.references.clear().then(() => {
      db.songs.clear().then(() => {
        db.books.clear().then(() => {
          app.fetchData();
        });
      });
    });
  }

  setSettings(settings) {
    this.setState({ settings: settings });
    this.db.settings.put(settings).then(this.pushDBToState);
  }

  returnToIndex(e) {
    this.setState({ page: "index" });
    window.history.pushState({ page: "index", currentBook: this.state.currentBook }, "", !!this.state.currentBook ? `/${this.state.currentBook.slug}/i` : "/");
  }

  setSongFromHistory(e) {
    if (e.state.page) {
      e.preventDefault(); // stop request to server for new html
      e.stopPropagation();
      this.setState({ page: e.state.page, currentBook: e.state.currentBook });
      window.scrollTo(0, 0);
    }
  }

  setSong(e) {
    var songId = e.target.closest(".index_row").id;
    this.setState({ page: songId });
    window.history.pushState({ page: songId, currentBook: this.state.currentBook }, "", songId);
    window.scrollTo(0, 0);
  }

  getSong(id) {
    // shortcut for preloaded song (load url with a song id) so user doesn't
    // wait for whole db to load.
    if (!!this.props.preloaded_song) {
      if (!!this.props.preloaded_current_book) {
        // If we are inside a book, the song's id will point to the song's index in that book
        if (this.props.preloaded_references.find(ref =>
          ref.book_id == this.props.preloaded_current_book.id &&
          ref.song_id == id)
        ) {
          return this.props.preloaded_song;
        }
      } else {
        if(this.props.preloaded_song.id == id) {
          return this.props.preloaded_song;
        }
      }

    }
    songs = this.state.songs;
    var song = null,
        ref_id = null;
    // If we are inside a book, the song's id will point to the song's index in that book
    if(!!this.state.currentBook) {
      var ref = this.state.references.find(ref =>
        ref.index == id &&
        ref.book_id == this.state.currentBook.id
      );
      ref_id = ref.song_id;
    }
    song = songs.find(song => song.id == (ref_id || id));

    return song || "couldn't find song";
  }

  setSearch(search) {
    this.setState({
      search: search,
      rowLimit: 100
    });
  }

  clearSearch() {
    this.setState({ search: "" });
    document.getElementById("index_search").focus();
  }

  goToBookIndex(bookSlug) {
    var currentBook = this.state.books.find(book => book.slug === bookSlug);
    this.setState({
      page: "index",
      currentBook: currentBook
    });
    window.history.pushState({ page: "index", currentBook: this.state.currentBook }, "", `/${bookSlug}/i`);
    window.scrollTo(0, 0);
  }

  clearBook() {
    this.setState({
      page: "index",
      currentBook: null,
      rowLimit: 100
    });
    window.history.pushState({ page: "index", currentBook: this.state.currentBook }, "", "/");
    window.scrollTo(0, 0);
  }

  toggleSettingsPage() {
    if (this.state.page == "settings") {
      this.returnToIndex("");
    } else {
      this.setState({ page: "settings" });
      window.history.pushState({ page: "settings", currentBook: this.state.currentBook }, "", "/");
    }
  }

  toggleBookIndex() {
    if (this.state.page == "books") {
      this.returnToIndex("");
    } else {
      this.setState({ page: "books" });
      window.history.pushState({ page: "books", currentBook: this.state.currentBook }, "", "/books");
    }
  }

  // toggle unless given a specific order
  toggleOrderIndexBy(newOrderIndexBy){
    if(newOrderIndexBy.constructor != String) {
      newOrderIndexBy = this.state.orderIndexBy == 'alpha' ? 'number' : 'alpha';
    }
    this.setState({orderIndexBy: newOrderIndexBy});
  }

  scrollToSong(songIndex) {
    this.setState({
      scrollTo: songIndex,
      rowLimit: this.state.rowLimit < songIndex ? (parseInt(songIndex) + 50) : this.state.rowLimit,
      search: ""
    });
  }

  setTheme(){
    var theme = this.state.settings.cssTheme;

    if(theme == "css-night") {
      document.body.classList.add('css-night');
      document.body.classList.remove('css-normal');
    } else if(theme == "css-normal") {
      document.body.classList.add('css-normal');
      document.body.classList.remove('css-night');
    }
  }

  render() {
    var page = this.state.page;
    var content;
    var indexNumber;
    var pageTitle = 'Songbase';
    switch (page) {
      case "index":
        if(!!this.state.currentBook) {
          pageTitle = this.state.currentBook.name + ' - Songbase';
        }
        content = (
          <SongIndex
            songs={this.state.songs}
            setSong={this.setSong}
            settings={this.state.settings}
            toggleSettingsPage={this.toggleSettingsPage}
            toggleBookIndex={!!this.state.currentBook ? this.clearBook : this.toggleBookIndex}
            books={this.state.books}
            currentBook={this.state.currentBook}
            references={this.state.references}
            loadingData={this.state.loadingData}
            setSearch={this.setSearch}
            clearSearch={this.clearSearch}
            search={this.state.search}
            orderIndexBy={this.state.orderIndexBy}
            toggleOrderIndexBy={this.toggleOrderIndexBy}
            scrollTo={this.state.scrollTo}
            rowLimit={this.state.rowLimit}
            infiniteScrolling={this.infiniteScrolling}
            key="song-index"
          />
        );
        break;
      case "settings":
        content = (
          <UserSettings
            setSettings={this.setSettings}
            settings={this.state.settings}
            toggleSettingsPage={this.toggleSettingsPage}
            setTheme={this.setTheme}
            cachedSongCount={this.state.totalSongsCached}
            resetCache={this.resetCache}
          />
        );
        break;
      case "books":
        content = (
          <BookIndex
          books={this.state.books || []}
          goToBookIndex={this.goToBookIndex}
          />
        );
        break;

      default: // display a song
        var song = this.getSong(page);
        pageTitle = song.title;
        if(!!this.state.currentBook) {
          indexNumber = <div className="title-number">{window.location.pathname.split('/').pop()}</div>;
        }
        content = (
          <div className="song-container">
            <SongDisplay lyrics={song.lyrics} />
            <SongReferences
              goToBookIndex={this.goToBookIndex}
              toggleOrderIndexBy={this.toggleOrderIndexBy}
              scrollToSong={this.scrollToSong}
              references={this.state.references.filter(
                ref => ref.song_id == song.id
              )}
              books={this.state.books}
              loadingData={this.state.loadingData}
            />
          </div>
        );
    }

    document.title = pageTitle;

    this.setTheme();
    return (
      <div className="song-app" key="song-app">
        <h1 className="home-title" onClick={this.returnToIndex}>
          {!!this.state.currentBook ? this.state.currentBook.name : "Songbase"}
          {indexNumber}
        </h1>
        {content}
      </div>
    );
  }
}
