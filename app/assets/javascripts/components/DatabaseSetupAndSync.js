class DatabaseSetupAndSync {
  constructor(app) {
    this.app = app;
    this.db = new Dexie("songbaseDB");
    this.state = app.state;

    this.initialize = this.initialize.bind(this);
    this.defineSchema = this.defineSchema.bind(this);
    this.initialize = this.initialize.bind(this);
    this.syncSettings = this.syncSettings.bind(this);
    this.pushIndexedDBToState = this.pushIndexedDBToState.bind(this);
    this.fetchDataFromAPI = this.fetchDataFromAPI.bind(this);
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

    this.db.settings.get({ settingsType: "global" }) // Fetch settings from indexedDB
                    .then(this.syncSettings) // Push settings to React state
                    .then(this.pushIndexedDBToState) // Push indexedDB data (scoped by settings) to React state
                    .then(this.fetchDataFromAPI) // Fetch data from API
                    .catch((e) => { this.log("Failed to fetch new data.", e); });
  }

  defineSchema() {
    // Change version number when db structure changes
    // Note that stores() specifies primary key, then *indexed* properties,
    // there may be more properties than specified here, these are just indexed ones.
    this.db.version(5).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang"
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
    this.db.settings.put(settings).then(this.pushIndexedDBToState);
  }


  // Push data from indexedDB to React's state
  pushIndexedDBToState() {
    this.log("Fetching songs from offline storage...");
    let app = this.app;
    let db = this.db;
    let langs = app.state.settings.languages;
    db.books
      .where("lang")
      .anyOf(langs)
      .toArray(books => {
        app.setState({ books: books });
        this.log('Updating state with ' + books.length + ' books');
        return books;
      })
      .then(books => {
        let book_ids = books.map(book => {
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
      .then(() => {
        if(app.props.book_slug && app.state.books.length > 0) {
          app.setState({
            currentBook: app.state.books.find(book => book.slug === app.props.book_slug)
          })
        }
      })
      .then(() => {
        db.songs.count(songCount => { app.setState({totalSongsCached: songCount}) });
        this.log("Finished offline storage fetch.");
      });
    return true
  }

  sortSongsByTitle(a, b) {
    let title = str => {
      return str.title.toUpperCase().replace(/[^[:alpha:]]/g, "");
    };
    let titleA = title(a);
    let titleB = title(b);
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

  fetchDataFromAPI() {
    // fetch a list of languages
    // sort the list so languages selected in settings are synced first
    // for each language, fetch and update db

    // The general way syncing is done is that we send the API a timestamp of
    // the date we last updated. The server then returns only data that has
    // been updated _after_ our last sync. This means we don't download the
    // entire db everytime we load songbase.

    let app = this.app;
    let db = this.db;
    let lastUpdatedAt = app.state.settings.updated_at || "";
    let newUpdateTime = new Date().getTime();
    // The "this" keyword changes as we move through scopes/promises, so we
    // keep a reference to the database setup and sync class here
    let thisSyncTool = this;

    this.log("Fetching data from api...");

    axios({
      method: "GET",
      url: "/api/v1/languages",
      headers: {
        "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content
      }
    }).then((response) => {
      let selectedLanguages = app.state.settings.languages;
      let hiddenLanguages = response.data.languages.filter(lang => !selectedLanguages.includes(lang));
      let allLanguages = selectedLanguages.concat(hiddenLanguages);

      thisSyncTool.log('selectedLanguages: ' + selectedLanguages);
      thisSyncTool.log('hiddenLanguages: ' + hiddenLanguages);

      // We fetch data by language to split the downloads into multiple
      // requests. It also lets us request the user-selected data first,
      // although since the requests are in parallel I don't know if it helps..
      allLanguages.forEach((language) => {
        thisSyncTool.fetchDataByLanguage(language, lastUpdatedAt)
      })
    }).then(() => {
      // Update IndexedDB with the last synced timestamp to be the current time:
      db.transaction(
        "rw",
        db.settings,
        () => {
          let settings = app.state.settings;
          settings["updated_at"] = newUpdateTime;
          app.setState({
            settings: settings
          });
          db.settings.put(settings);
        }
      )
    }).catch(this.axiosError);
    thisSyncTool.log("Fetch completed.");
  }

  fetchDataByLanguage(language, lastUpdatedAt) {
    let app = this.app,
        db = this.db,
        thisSyncTool = this;

    thisSyncTool.log("Fetching " + language + " songs");
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
      thisSyncTool.log("Syncing " + response.data.songs.length + " " + language + " songs with indexedDB...");
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

          let settings = app.state.settings;
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
      thisSyncTool.log("Syncing " + language + " completed.");
      thisSyncTool.pushIndexedDBToState();
    });
  }

  // reset updated timestamp, wipe db tables, then call fetch
  resetDbData() {
    let settings = this.state.settings,
    db = this.db;

    settings.updated_at = 0;
    settings.languagesInfo = [];
    this.app.setState({settings: settings, totalSongsCached: 0});

    db.references.clear().then(() => {
      db.songs.clear().then(() => {
        db.books.clear().then(() => {
          this.fetchDataFromAPI();
        });
      });
    });
  }
}