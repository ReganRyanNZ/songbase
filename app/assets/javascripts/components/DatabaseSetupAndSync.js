class DatabaseSetupAndSync {
  constructor(app) {
    this.app = app;
    this.db = new Dexie("songbaseDB");
    this.state = app.state;

    this.initialize = this.initialize.bind(this);
    this.defineSchema = this.defineSchema.bind(this);
    this.initialize = this.initialize.bind(this);
    this.syncSettings = this.syncSettings.bind(this);
    this.pushDBToState = this.pushDBToState.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.resetDbData = this.resetDbData.bind(this);
    this.fetchDataByLanguage = this.fetchDataByLanguage.bind(this);
    this.setSettings = this.setSettings.bind(this);
    this.log = this.log.bind(this);
    this.axiosError = this.axiosError.bind(this);
  }

  log(string) {
    if(this.state.logSyncData) { console.log(string) }
  }

  initialize() {
    this.defineSchema();

    this.db.settings
      .get({ settingsType: "global" })
      .then(this.syncSettings)
      .then(this.pushDBToState)
      .then(this.fetchData)
      .catch((e) => {
        this.log("Failed to fetch new data.", e);
      });
  }

  defineSchema() {
    // Change version number when db structure changes
    // Note that stores() specifies primary key, then *indexed* properties,
    // there may be more properties than specified here, these are just indexed ones.
    // NOTE I somewhat screwed up some versioning, that's why several versions are the same.
    this.db.version(1).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });
    this.db.version(2).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });
    this.db.version(3).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });
    this.db.version(4).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });
  }

  syncSettings(settingsFromDb) {
    if(!!settingsFromDb) {
      this.log("Settings via IndexedDB detected.");
      this.app.setState({ settings: settingsFromDb });
    } else {
      this.log("No settings found. Creating defaults...");
      this.db.settings.add(this.state.settings);
    }
  }

  setSettings(settings) {
    this.app.setState({ settings: settings });
    this.db.settings.put(settings).then(this.pushDBToState);
  }


  pushDBToState() {
    this.log("Fetching songs from offline storage...");
    var app = this.app;
    var db = this.db;
    var langs = app.state.settings.languages;
    db.books
      .where("lang")
      .anyOf(langs)
      .toArray(books => {
        app.setState({ books: books });
        this.log('Updating state with ' + books.length + ' books');
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
          this.log('Updating state with ' + references.length + ' references');
            app.setState({ references: references });
          });
      })
      .then(() => {
        db.songs
          .where("lang")
          .anyOf(langs)
          .toArray(songs => {
            songs.sort(this.sortSongsByTitle);
            app.setState({ songs: songs, loadingData: songs.length == 0 });
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
        if(app.state.logSyncData) { console.log("Finished offline storage fetch."); }
      });
    return true
  }

  sortSongsByTitle(a, b) {
    var title = str => {
      return str.title.toUpperCase().replace(/[^[:alpha:]]/g, "");
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
  }

  axiosError(error) {
    this.log('Error trying to connect to songbase API, perhaps we are offline?');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      this.log(error.response.data);
      this.log(error.response.status);
      this.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      this.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      this.log('Error', error.message);
    }
    this.log(error.config);
  }

  fetchData() {
    // fetch a list of languages
    // sort the list so languages in settings are first
    // for each language, fetch and update db
    let app = this.app,
        db = this.db,
        thisSyncTool = this,
        lastUpdatedAt = app.state.settings.updated_at || "",
        newUpdateTime = new Date().getTime();

    this.log("Fetching data from api...");

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
        thisSyncTool.fetchDataByLanguage(language, lastUpdatedAt)
      })
    }).then(function updateLastUpdatedAt() {
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
    }).catch(this.axiosError);
    if(app.state.logSyncData) { console.log("Fetch completed."); }
  }

  fetchDataByLanguage(language, lastUpdatedAt) {
    let app = this.app,
        db = this.db,
        thisSyncTool = this;


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

          if(response.data.songCount > 0) {
            settings['languagesInfo'].push([language, response.data.songCount]); // add new value
          }
          app.setState({
            settings: settings
          });
          db.settings.put(settings);
        }
      );
    })
    .then(function(data) {
      if(app.state.logSyncData) { console.log("Syncing " + language + " completed."); }
      thisSyncTool.pushDBToState();
    });
  }

  // reset updated timestamp, wipe db tables, then call fetch
  resetDbData() {
    var settings = this.state.settings,
    db = this.db;

    settings.updated_at = 0;
    settings.languagesInfo = [];
    this.app.setState({settings: settings, totalSongsCached: 0});

    db.references.clear().then(() => {
      db.songs.clear().then(() => {
        db.books.clear().then(() => {
          this.fetchData();
        });
      });
    });
  }
}