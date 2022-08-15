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
    this.getSong = this.getSong.bind(this);
    this.setSearch = this.setSearch.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.toggleOrderIndexBy = this.toggleOrderIndexBy.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.scrollToSong = this.scrollToSong.bind(this);
    this.infiniteScrolling = this.infiniteScrolling.bind(this);

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
            setSong={this.navigate.setSong}
            settings={this.state.settings}
            toggleSettingsPage={this.navigate.toggleSettingsPage}
            toggleBookIndex={this.navigate.toggleBookIndex}
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
            setSettings={this.dbSync.setSettings}
            settings={this.state.settings}
            toggleSettingsPage={this.navigate.toggleSettingsPage}
            setTheme={this.setTheme}
            cachedSongCount={this.state.totalSongsCached}
            resetCache={this.dbSync.resetDbData}
          />
        );
        break;
      case "books":
        content = (
          <IndexOfBooks
          books={this.state.books || []}
          goToBookIndex={this.navigate.goToBookIndex}
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
              goToBookIndex={this.navigate.goToBookIndex}
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
        <h1 className="home-title" onClick={this.navigate.returnToIndex}>
          {!!this.state.currentBook ? this.state.currentBook.name : "Songbase"}
          {indexNumber}
        </h1>
        {content}
      </div>
    );
  }
}
