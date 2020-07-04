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
        updated_at: 0
      },
      bookSlug: props.book_slug,
      currentBook: props.preloaded_current_book || null,
      songs: [],
      references: props.preloaded_references || [],
      books: props.preloaded_books || [],
      loadingData: true,
      search: ""
    };

    // bind all methods to this context (so we can use them)
    this.pushDBToState = this.pushDBToState.bind(this);
    this.setSettings = this.setSettings.bind(this);
    this.toggleSettingsPage = this.toggleSettingsPage.bind(this);
    this.toggleBookIndex = this.toggleBookIndex.bind(this);
    this.setBook = this.setBook.bind(this);
    this.clearBook = this.clearBook.bind(this);
    this.setSong = this.setSong.bind(this);
    this.setSongFromHistory = this.setSongFromHistory.bind(this);
    this.getSong = this.getSong.bind(this);
    this.returnToIndex = this.returnToIndex.bind(this);
    this.setSearch = this.setSearch.bind(this);
    this.clearSearch = this.clearSearch.bind(this);

    // setup history so users can navigate via browser
    window.history.replaceState({ page: this.state.page }, "", window.location.pathname);
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
          console.log("Settings via IndexedDB detected.");
          app.setState({ settings: result });
        } else {
          console.log("No settings found. Creating defaults...");
          app.db.settings.add(app.state.settings);
        }
      })
      .then(app.pushDBToState)
      .then(function(response) {
        console.log("Fetching data from api...");
        app.fetchData();
      }).catch(() => {
        console.log("Failed to fetch new data.");
      });
  }

  fetchData() {
    var app = this;
    var db = app.db;
    axios({
      method: "GET",
      url: "/api/v1/app_data",
      params: {
        updated_at: app.state.settings.updated_at || ""
      },
      headers: {
        "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content
      }
    })
      .then(function(response) {
        console.log("Fetch completed.");
        console.log(
          "Syncing " + response.data.songs.length + " songs with indexedDB..."
        );
        // run this all in a transaction, to stop mid-sync cut outs from wrecking everything
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
            settings["updated_at"] = new Date().getTime();
            settings["languagesInfo"] = response.data.languages_info;
            console.log(settings);
            app.setState({
              settings: settings
            });
            db.settings.put(settings);
          }
        );
      })
      .then(function(data) {
        console.log("Syncing completed.");
        app.pushDBToState();
      });
  }

  pushDBToState() {
    console.log("Fetching songs from offline storage...");
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
            app.setState({ songs: songs, loadingData: false });
            console.log("Fetching complete.");
          });
      })
      .then(result => {
        if(app.props.book_slug) {
          app.setState({
            currentBook: app.state.books.find(book => book.slug === app.props.book_slug)
          })
        }
      });
    // delete expired songs
  }

  setSettings(settings) {
    this.setState({ settings: settings });
    this.db.settings.put(settings).then(this.pushDBToState);
  }

  returnToIndex(e) {
    this.setState({ page: "index" });
    window.history.pushState({ page: "index" }, "", !!this.state.currentBook ? `/${this.state.currentBook.slug}/i` : "/");
  }

  setSongFromHistory(e) {
    if (e.state.page) {
      e.preventDefault(); // stop request to server for new html
      e.stopPropagation();
      this.setState({ page: e.state.page });
      window.scrollTo(0, 0);
    }
  }

  setSong(e) {
    var songId = e.target.closest(".index_row").id;
    this.setState({ page: songId });
    window.history.pushState({ page: songId }, "", songId);
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
    this.setState({ search: search });
  }

  clearSearch() {
    this.setState({ search: "" });
    document.getElementById("index_search").focus();
  }

  setBook(e) {
    var bookSlug = e.target.closest(".index_row").id;
    var currentBook = this.state.books.find(book => book.slug === bookSlug);
    this.setState({
      page: "index",
      currentBook: currentBook
    });
    window.history.pushState({ page: "index" }, "", `/${bookSlug}/i`);
    window.scrollTo(0, 0);
  }

  clearBook() {
    this.setState({
      page: "index",
      currentBook: null
    });
    window.history.pushState({ page: "index" }, "", "/");
    window.scrollTo(0, 0);
  }

  toggleSettingsPage() {
    if (this.state.page == "settings") {
      this.returnToIndex("");
    } else {
      this.setState({ page: "settings" });
      window.history.pushState({ page: "settings" }, "", "/");
    }
  }

  toggleBookIndex() {
    if (this.state.page == "books") {
      this.returnToIndex("");
    } else {
      this.setState({ page: "books" });
      window.history.pushState({ page: "books" }, "", "/books");
    }
  }

  render() {
    var page = this.state.page;
    var content;
    var indexNumber;
    switch (page) {
      case "index":
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
          />
        );
        break;
      case "books":
        content = (
          <BookIndex
          books={this.state.books || []}
          setBook={this.setBook}
          />
        );
        break;
      default:
        var song = this.getSong(page);
        if(!!this.state.currentBook) {
          indexNumber = <div className="title-number">{window.location.pathname.split('/').pop()}</div>;
        }
        content = (
          <div className="song-container">
            <SongDisplay lyrics={song.lyrics} />
            <SongReferences
              references={this.state.references.filter(
                ref => ref.song_id == song.id
              )}
              books={this.state.books}
              loadingData={this.state.loadingData}
            />
          </div>
        );
    }
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
