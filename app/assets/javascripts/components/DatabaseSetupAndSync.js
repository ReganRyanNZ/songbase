class DatabaseSetupAndSync {
  constructor(app) {
    this.app = app;
    this.db = new Dexie("songbaseDB");
    this.migrating = false;

    this.syncSettings = this.syncSettings.bind(this);
    this.pushIndexedDBToState = this.pushIndexedDBToState.bind(this);
    this.fetchDataFromAPI = this.fetchDataFromAPI.bind(this);
    this.resetDbData = this.resetDbData.bind(this);
    this.fetchDataByLanguage = this.fetchDataByLanguage.bind(this);
    this.setSettings = this.setSettings.bind(this);
    this.log = this.log.bind(this);
    this.axiosError = this.axiosError.bind(this);
    this.migrateFromV1toV2 = this.migrateFromV1toV2.bind(this);
  }

  log(string) {
    if(this.app.state.logSyncData) { console.log(string) }
  }

  initialize() {
    this.log('Initializing db sync...')
    this.defineSchema();
    let thisSyncTool = this;
    let skipPromise = () => {};

    this.db.settings.get({ settingsType: "global" }) // Fetch settings from indexedDB
                    .then(thisSyncTool.syncSettings) // Push settings to React state
                    .then(thisSyncTool.migrateFromV1toV2)
                    .then(thisSyncTool.migrating ? skipPromise : thisSyncTool.pushIndexedDBToState)
                    .then(thisSyncTool.migrating ? skipPromise : thisSyncTool.fetchDataFromAPI)
                    .catch((e) => { thisSyncTool.log("Failed to fetch new data.", e); });
  }

  defineSchema() {
    // Change version number when db structure changes
    // Note that stores() specifies primary key, then *indexed* properties,
    // there may be more properties than specified here, these are just indexed ones.
    this.db.version(5).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, *languages",
      references: null
    });
    this.db.version(4).stores({
      settings: "settingsType",
      songs: "id, title, lang",
      books: "id, slug, lang",
      references: "id, song_id, book_id"
    });
    this.log('Dexie schema defined');
  }

  async syncSettings(settingsFromDb) {
    if(!!settingsFromDb) {
      this.log("Settings via IndexedDB detected:");
      this.log(settingsFromDb);
      let promisedSetState = (newState) => new Promise((resolve) => this.app.setState(newState, resolve));
      await promisedSetState({ settings: settingsFromDb });
    } else {
      this.log("No settings found. Creating defaults...");
      this.db.settings.add(this.app.state.settings);
    }
  }

  // v1 of the api included a separate references table.
  // v2 puts the references into the books table.
  // So we need to check if references exist in indexedDB,
  // if it does we need a full reset.
  migrateFromV1toV2() {
    let settings = this.app.state.settings;
    // MIGRATION_DATE is set a day after we actually deploy, so the overlap
    // covers all timezones. This means for 1 day songbase will load slowly
    // because it redownloads every session.
    const MIGRATION_DATE = new Date('August 22, 2023 03:45:00').getTime();
    this.log('Last updated at: ' + settings.updated_at);
    this.log('MIGRATION_DATE: ' + MIGRATION_DATE);
    if(settings.updated_at > 0 && settings.updated_at < MIGRATION_DATE){
      this.log("Resetting DB for v2 API migration.")
      this.resetDbData();
      this.migrating = true;
    } else {
      this.log('No need to migrate this db');
    }
  }

  setSettings(settings) {
    this.app.setState({ settings: settings });
    this.db.settings.put(settings).then(this.pushIndexedDBToState);
  }


  // Push data from indexedDB to React's state
  pushIndexedDBToState() {
    this.log("Loading IndexedDB into state...");
    let app = this.app;
    let db = this.db;
    let languages = app.state.settings.languages;

    db.books
      .where("languages")
      .anyOf(languages)
      .distinct()
      .toArray(books => {
        this.log('Pushing books to state:');
        this.log(books);
        app.setState({ books: books });
        return books;
      })
      .then(() => {
        db.songs
          .where("lang")
          .anyOf(languages)
          .toArray(songs => {
            songs.sort(this.sortSongsByTitle);
            app.setState({ songs: songs, loadingData: false });
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
        this.log("IndexedDB loaded into state.");
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
      url: "/api/v2/languages",
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
          thisSyncTool.log('updated_at is now: ' + app.state.settings.updated_at);
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
      url: "/api/v2/app_data",
      params: {
        updated_at: lastUpdatedAt,
        language: language
      },
      headers: {
        "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content
      }
    })
    .then(function(response) {
      thisSyncTool.log('Response from API: ');
      thisSyncTool.log(response);

      thisSyncTool.log("Syncing " + response.data.songs.length + " " + language + " songs with indexedDB...");
      // run this all in a transaction, to stop mid-sync cut outs from wrecking everything.
      db.transaction(
        "rw",
        db.songs,
        db.books,
        db.settings,
        () => {
          db.songs.bulkPut(response.data.songs);
          db.books.bulkPut(response.data.books);
          db.songs.bulkDelete(response.data.destroyed.songs);
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

  // reset updated timestamp, wipe db, reinitialize then call fetch
  resetDbData() {
    this.log('RESETTING DB AND UPDATED AT TIMESTAMP');

    let settings = this.app.state.settings;
    settings.updated_at = 0;
    settings.languagesInfo = [];
    this.app.setState({settings: settings, totalSongsCached: 0});
    let thisSyncTool = this;

    this.db.delete().then(() => {
      thisSyncTool.db = new Dexie("songbaseDB");
      thisSyncTool.defineSchema();
      thisSyncTool.fetchDataFromAPI();
    });
  }
}