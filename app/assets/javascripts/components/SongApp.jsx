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
      currentBook: props.preloaded_current_book || null,
      songs: [],
      references: [], // obsolete, but needed for sync migration
      books: [props.preloaded_current_book].filter(notNull => notNull),
      loadingData: false,
      search: "",
      orderIndexBy: 'alpha',
      scrollTo: null,
      rowLimit: 100,
      logSyncData: false,
      logSongApp: false,
      showChords: localStorage.getItem('showChords') == 'false' ? false : true, // Local storage to load faster than indexedDB, and synchronously
    };

    this.navigate = new AppNavigation(this);
    this.navigate.setupInitialHistoryState();

    this.dbSync = new DatabaseSetupAndSync(this);
    this.dbSync.initialize();
  }

  // when user clicks "back" in their browser, navigate to previous song
  componentDidMount() {
    window.addEventListener("popstate", this.navigate.toPreviousPageInHistory);
  }

  componentDidUpdate() {
    if(!!this.state.scrollTo && this.state.page == 'index') {
      let element = document.getElementById(this.state.scrollTo);
      if(element) {
        element.scrollIntoView({ block: 'center'});
      }
      this.setState({scrollTo: null});
    }
  }

  log(string) {
    if(this.state.logSongApp) { console.log(string) }
  }

  toggleMusic() {
    let showChords = !this.state.showChords;
    this.setState({showChords: showChords});
    localStorage.setItem('showChords', showChords);
  }

  infiniteScrolling(){
    let pixelsBeforeTheEnd = 500,
        currentScrollPoint = window.innerHeight + document.documentElement.scrollTop,
        maxScrollPoint = document.scrollingElement.scrollHeight;
    if (pixelsBeforeTheEnd + currentScrollPoint > maxScrollPoint) {
        this.setState({rowLimit: this.state.rowLimit + 100});
    }
  }

  getSong(id) {
    if (this.props.preloaded_song) {
      if (this.props.preloaded_current_book) {
        // If we are inside a book, the song's id will point to the song's index in that book
        // So we need to check if a preloaded book_ref includes id as its index
        if (this.props.preloaded_book_refs.find(book_ref => book_ref[2] == id)) {
          return this.props.preloaded_song;
        }
      } else {
        if(this.props.preloaded_song.id == id) {
          return this.props.preloaded_song;
        }
      }
    }

    // If we are inside a book, the song's id will point to the song's index in that book
    let song_id = this.state.currentBook ? this.getSongIdFromBook(this.state.currentBook, id) : id;

    return this.state.songs.find(song => song.id == song_id) || "couldn't find song";
  }

  // Books stored songs as {song.id => index}
  // so we need this method for a reverse lookup
  getSongIdFromBook(book, index) {
    return Object.keys(book.songs).find(song_id => book.songs[song_id] === index);
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

  setTheme() {
    document.body.removeAttribute('class');
    document.body.classList.add(this.state.settings.cssTheme);
  }

  getBookReferencesForSong(song) {
    return this.state.books.map(book => {return book.songs[song.id] ? [book.slug, book.name, book.songs[song.id]] : null }).filter(notNull => notNull);
  }

  render() {
    let page = this.state.page;
    let content;
    let indexNumber;
    let pageTitle = 'Songbase';
    switch (page) {
      case "index":
        if(!!this.state.currentBook) {
          pageTitle = this.state.currentBook.name + ' - Songbase';
        }
        content = (
          <SongIndex
            songs={this.state.songs}
            setSong={this.navigate.setSong}
            settings={this.state.settings}
            toggleSettingsPage={this.navigate.toggleSettingsPage}
            toggleBookIndex={this.navigate.toggleBookIndex}
            books={this.state.books}
            currentBook={this.state.currentBook}
            loadingData={this.state.loadingData}
            setSearch={this.setSearch.bind(this)}
            clearSearch={this.clearSearch.bind(this)}
            search={this.state.search}
            getSongIdFromBook={this.getSongIdFromBook}
            orderIndexBy={this.state.orderIndexBy}
            toggleOrderIndexBy={this.toggleOrderIndexBy.bind(this)}
            scrollTo={this.state.scrollTo}
            rowLimit={this.state.rowLimit}
            infiniteScrolling={this.infiniteScrolling.bind(this)}
            key="song-index"
          />
        );
        break;
      case "settings":
        content = (
          <UserSettings
            setSettings={this.dbSync.setSettings}
            settings={this.state.settings}
            toggleSettingsPage={this.navigate.toggleSettingsPage}
            setTheme={this.setTheme.bind(this)}
            cachedSongCount={this.state.totalSongsCached}
            resetCache={this.dbSync.resetDbData}
          />
        );
        break;
      case "books":
        this.log('[Navigation] Books page:');
        this.log(this.state.books);
        content = (
          <IndexOfBooks
          books={this.state.books || []}
          goToBookIndex={this.navigate.goToBookIndex}
          />
        );
        break;

      default: // display a song
        let song = this.getSong(page);
        let songWasPreloaded = this.props.preloaded_song && this.props.preloaded_song.title == song.title;
        pageTitle = song.title;
        if(!!this.state.currentBook) {
          indexNumber = <div className="title-number">{window.location.pathname.split('/').pop()}</div>;
        }

        content = (
          <div className="song-container">
            <SongDisplay
              title={song.title}
              lyrics={song.lyrics}
              analyticsPath={songWasPreloaded ? null : window.location.href}
              showChords={this.state.showChords}
              toggleMusic={this.toggleMusic.bind(this)}/>
            <SongReferences
              goToBookIndex={this.navigate.goToBookIndex}
              toggleOrderIndexBy={this.toggleOrderIndexBy.bind(this)}
              scrollToSong={this.scrollToSong.bind(this)}
              bookRefs={(this.state.loadingData && this.props.preloaded_book_refs) || this.getBookReferencesForSong(song)}
              loadingData={this.state.loadingData}
            />
          </div>
        );
    }

    document.title = pageTitle;

    let title = <h1 className="home-title" onClick={this.navigate.returnToIndex}>
                  {!!this.state.currentBook ? this.state.currentBook.name : "Songbase"}
                  {indexNumber}
                </h1>;

    this.setTheme();
    return (
      <div className="song-app" key="song-app">
        {title}
        {content}
      </div>
    );
  }
}
