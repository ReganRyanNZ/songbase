class DatabaseSetupAndSync {
  constructor(app) {
    this.app = app;
    this.db = new Dexie("songbaseDB");

    this.loadSettingsToState = this.loadSettingsToState.bind(this);
    this.pushIndexedDBToState = this.pushIndexedDBToState.bind(this);
    this.fetchDataFromAPI = this.fetchDataFromAPI.bind(this);
    this.resetDbData = this.resetDbData.bind(this);
    this.fetchDataByLanguage = this.fetchDataByLanguage.bind(this);
    this.setSettings = this.setSettings.bind(this);
    this.log = this.log.bind(this);
    this.time = this.time.bind(this);
    this.migrateFromV1toV2 = this.migrateFromV1toV2.bind(this);

    this.timers = [];
    this.logSyncData = false;
  }

  log(string) {
    if(this.logSyncData) { console.log(string) }
  }

  // add to start and end of something to time it
  time(name) {
    if(!this.logSyncData) { return }

    if (this.timers.includes(name)) {
      console.timeEnd(name)
      this.timers.pop(name)
    } else {
      console.time(name)
      this.timers.push(name)
    }
  }

  async initialize() {
    this.log('Initializing db sync...')
    this.defineSchema();

    try {
      let cachedSettings = await this.db.settings.get({ settingsType: "global" }) // Fetch settings from indexedDB
      await this.loadSettingsToState(cachedSettings) // Push settings to React state

      // Nuke IndexedDB if client hasn't synced since v2 came out:
      let migratingDB = this.migrateFromV1toV2()

      if (!migratingDB) {
        this.pushIndexedDBToState() // push current cached data immediately
        this.fetchDataFromAPI() // sync with api
      }
    } catch (e) {
      this.log({Error: "Failed to fetch new data.", e})
    }
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

  async loadSettingsToState(cachedSettings) {
    if(cachedSettings) {
      this.log("Settings via IndexedDB detected:");
      this.log(cachedSettings);
      let promisedSetState = (newState) => new Promise((resolve) => this.app.setState(newState, resolve));
      await promisedSetState({ settings: cachedSettings });
    } else {
      this.log("No settings found. Creating defaults...");
      this.db.settings.add(this.app.state.settings); // If there are no cached settings, then we'll use the state's default settings
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
      return true;
    } else {
      this.log('No need to migrate this db');
      return false;
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

    const csrfToken = document.querySelector("meta[name=csrf-token]").content;

    fetch("/api/v2/languages", {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
    })
    .then((response) => response.json())
    .then((data) => {

      let selectedLanguages = app.state.settings.languages;
      let hiddenLanguages = data.languages.filter(lang => !selectedLanguages.includes(lang));
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
    }).catch(error => console.error("Error:", error));
    thisSyncTool.log("Fetch completed.");
  }

  fetchDataByLanguage(language, lastUpdatedAt) {
    let app = this.app,
        db = this.db,
        thisSyncTool = this;

    thisSyncTool.log("Fetching " + language + " songs");
    const csrfToken = document.querySelector("meta[name=csrf-token]").content;
    const searchParams = new URLSearchParams({ updated_at: lastUpdatedAt, language });

    fetch("/api/v2/app_data?" + searchParams.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
    })
    .then(response => response.json())
    .then((data) => {
      thisSyncTool.log('Response from API: ');
      thisSyncTool.log(data);

      thisSyncTool.log("Syncing " + data.songs.length + " " + language + " songs with indexedDB...");
      // run this all in a transaction, to stop mid-sync cut outs from wrecking everything.
      db.transaction(
        "rw",
        db.songs,
        db.books,
        db.settings,
        () => {
          db.songs.bulkPut(data.songs);
          db.books.bulkPut(data.books);
          db.songs.bulkDelete(data.destroyed.songs);
          db.books.bulkDelete(data.destroyed.books);

          let settings = app.state.settings;
          settings['languagesInfo'] = settings['languagesInfo'].filter(info => info[0] != language); // remove previous value

          if(data.songCount > 0) {
            settings['languagesInfo'].push([language, data.songCount]); // add new value
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
    }).catch(error => console.error("Error:", error));
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