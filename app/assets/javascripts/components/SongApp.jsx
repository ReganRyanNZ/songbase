class SongApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: (props.song_id || 'index'),
      settings: {
        settingsType: 'global',
        languages: ['english'],
        updated_at: 0
      },
      songs: [props.preloaded_song] || [],
      references: props.preloaded_references || [],
      books: props.preloaded_books || []
    }

    // bind all methods to this context (so we can use them)
    this.setSettings = this.setSettings.bind(this);
    this.toggleSettingsPage = this.toggleSettingsPage.bind(this);
    this.setSong = this.setSong.bind(this);
    this.setSongFromHistory = this.setSongFromHistory.bind(this);
    this.getSong = this.getSong.bind(this);
    this.returnToIndex = this.returnToIndex.bind(this);
    this.getLanguages = this.getLanguages.bind(this);
    this.getLanguageCounts = this.getLanguageCounts.bind(this);

    // setup history so users can navigate via browser
    if(this.state.page == 'index') {
      window.history.replaceState({page: 'index'}, '', '/');
    } else {
      window.history.replaceState({page: this.state.page}, '', '/' + this.state.page);
    }
  }

  componentWillMount() {
    this.initializeDB();
  }

  // when user clicks "back" in their browser, navigate to previous song
  componentDidMount() {
    window.addEventListener("popstate", this.setSongFromHistory);
  }

  initializeDB() {
    var app = this;
    app.db = new Dexie("songbaseDB");

    // Change version number when db structure changes
    // Note that stores() specifies primary key, then *indexed* properties,
    // there may be more properties than specified here, these are just indexed ones.
    // NOTE I somewhat screwed up some versioning, that's why several versions are the same.
    app.db.version(1).stores({
      settings: 'settingsType',
      songs: 'id, title, lang',
      books: 'id, slug, lang',
      references: 'id, song_id, book_id'
    });
    app.db.version(2).stores({
      settings: 'settingsType',
      songs: 'id, title, lang',
      books: 'id, slug, lang',
      references: 'id, song_id, book_id'
    });
    app.db.version(3).stores({
      settings: 'settingsType',
      songs: 'id, title, lang',
      books: 'id, slug, lang',
      references: 'id, song_id, book_id'
    });
    app.db.version(4).stores({
      settings: 'settingsType',
      songs: 'id, title, lang',
      books: 'id, slug, lang',
      references: 'id, song_id, book_id'
    });

    // initialize settings, set defaults if settings doesn't exist
    app.db.settings.get({settingsType: 'global'})
    .then((result) => {
      if(result) {
        console.log("Settings via IndexedDB detected.");
        app.setState({settings: result})
      } else {
        console.log("No settings found. Creating defaults...");
        db.settings.add(app.state.settings);
      }
      console.log("Fetching data from api...")
    }).then(function (response) {
      app.fetchData();
    }).catch(()=> {
      console.log("Failed to fetch new data.");
      app.app.pushDBToState();
    });
  }

  fetchData() {
    var app = this;
    var db = app.db;
    axios({
      method: 'GET',
      url: '/api/v1/app_data',
      params: {
        updated_at: app.state.settings.updated_at || ''
      },
      headers: {
        'X-CSRF-Token': document.querySelector("meta[name=csrf-token]").content
      }
    }).then(function (response) {
      console.log("Fetch completed.");
      console.log("Syncing " + response.data.songs.length + " songs with indexedDB...");
      // run this all in a transaction, to stop mid-sync cut outs from wrecking everything
      db.transaction('rw', db.songs, db.books, db.references, db.settings, ()=>{
        db.songs.bulkPut(response.data.songs);
        db.references.bulkPut(response.data.references);
        db.books.bulkPut(response.data.books);
        var settings = app.state.settings;
        settings["updated_at"] = new Date().getTime();
        console.log(settings);
        app.setState({
          settings: settings
        })
        db.settings.put(settings);
      });
    }).then(function (data) {
      console.log("Syncing completed.");
      app.pushDBToState();
    });
  }

  pushDBToState() {
    console.log("Fetching songs from offline storage...");
    var app = this;
    var db = app.db;
    var langs = app.state.settings.languages;
    db.songs.where('lang').anyOf(langs).toArray((songs) => {
      songs.sort((a,b) => {
        var title = (str) => { return str.title.toUpperCase().replace(/[^A-Z]/g, '') };
        var titleA = title(a);
        var titleB = title(b);
        if(titleA > titleB) {
          return 1
        } else if(titleA < titleB) {
          return -1
        } else {
          return 0
        }
      });
      app.setState({songs: songs});
      console.log("Fetching complete.");
    });
    db.books.where('lang').anyOf(langs).toArray((books) => {
      app.setState({books: books});
      return books;
    }).then((books) => {
      var book_ids = books.map((book) => { return book.id })
      db.references.where('book_id').anyOf(book_ids).toArray((references) => {
        app.setState({references: references});
      });
    });
    // delete expired songs
  }

  setSettings(settings) {
    this.db.settings.put(settings);
    this.setState({settings: settings});
  }

  returnToIndex(e) {
    this.setState({page: 'index'});
    window.history.pushState({page: 'index'}, '', '/');
    window.scrollTo(0, 0);
  }

  setSongFromHistory(e) {
    if(e.state.page){
      e.preventDefault(); // stop request to server for new html
      e.stopPropagation();
      this.setState({page: e.state.page});
      window.scrollTo(0, 0);
    }
  }

  setSong(e) {
    var songId = e.target.closest(".index_row").id;
    this.setState({page: songId});
    window.history.pushState({page: songId}, '', songId);
    window.scrollTo(0, 0);
  }

  getSong(id) {
    songs = this.state.songs;
    for(var i=0; i < songs.length; i++){
      if(songs[i].id == id) {
        return songs[i];
      }
    }
    return "couldn't find song";
  }

  // get a list of unique languages in the db
  getLanguages() {
    return this.state.songs.map(s => s.lang).filter((v, i, a) => a.indexOf(v) === i).sort();
  }

  // get a count of the languages in the db
  getLanguageCounts() {
    counts = {};
    langs = this.state.songs.map(s => s.lang).forEach(l => counts[l] = (counts[l] || 0) + 1);

    return counts;
  }

  toggleSettingsPage() {
    if(this.state.page == "settings") {
      this.returnToIndex('');
    } else {
      this.setState({page: "settings"});
      window.history.pushState({page: "settings"}, '', '/');
    }
  }

  render() {
    var page = this.state.page;
    var content;
    switch(page) {
      case "index":
        content = <SongIndex
            songs={this.state.songs}
            setSong={this.setSong}
            settings={this.state.settings}
            toggleSettingsPage={this.toggleSettingsPage}
            images={this.props.images}
            books={this.state.books}
            references={this.state.references}
            />
        break;
      case "settings":
        content = <UserSettings
            languages={this.getLanguages()}
            languageCounts={this.getLanguageCounts()}
            setSettings={this.setSettings}
            settings={this.state.settings}
            toggleSettingsPage={this.toggleSettingsPage}
            images={this.props.images}
          />
        break;
      default:
        content = <div className="song-container">
            <SongDisplay
              lyrics={ this.getSong(page).lyrics }
              references={this.getSong(page).references}
            />
            <SongReferences
              references={this.state.references.filter((ref) => ref.song_id == page)}
              books={this.state.books}
            />
          </div>
    }
    return(
      <div className="song-app">
        <h1 className="home-title" onClick={this.returnToIndex}>Songbase</h1>
        {content}
      </div>
    )
  }
}