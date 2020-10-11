class SongIndex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rowLimit: 100 // react gets laggy rendering 2k songs, so there's a limit
    }

    this.searchInputChange = this.searchInputChange.bind(this);
    this.getSearchResults = this.getSearchResults.bind(this);
    this.infiniteScrolling = this.infiniteScrolling.bind(this);
  }

  componentWillMount(){
    window.addEventListener('scroll', this.infiniteScrolling);
  }

  componentWillUnmount(){
    window.removeEventListener('scroll', this.infiniteScrolling);
  }

  infiniteScrolling(){
    var pixelsBeforeTheEnd = 500,
        currentScrollPoint = window.innerHeight + document.documentElement.scrollTop,
        maxScrollPoint = document.scrollingElement.scrollHeight;
    if (pixelsBeforeTheEnd + currentScrollPoint > maxScrollPoint) {
        this.setState({rowLimit: this.state.rowLimit + 100});
    }
  }

  searchInputChange(event) {
    switch (event.target.id) {
      case "index_search":
        this.setState({rowLimit: 100});
        this.props.setSearch(event.target.value);
        break;
    }
  }

  searchIsNumber() {
    var isNumberRegex = new RegExp("^[0-9]+$", "i");
    return isNumberRegex.test(this.props.search);
  }

  getSearchResults() {
    var stripString = function(str) {
      str = str.replace(/\_/g, " ");
      return str.normalize("NFD").replace(/(\[.+?\])|[’'",“\-—–!?()\[\]]|[\u0300-\u036f]/g, "");
    };
    var songs = this.props.songs;
    var references = this.props.references;

    if(songs.length === 0) {
      return [];
    }

    // scope songs to the current selected book
    if(this.props.currentBook != null) {
      references = references.filter(ref => ref.book_id === this.props.currentBook.id)
      var song_ids = references.map(ref => ref.song_id);
      songs = songs.filter(song => song_ids.includes(song.id));
    }

    var strippedSearch = stripString(this.props.search);
    var searchResults = [];

    // filter songs by language settings
    // This is no longer needed while songs in state are set by language
    // songs = songs.filter(function(song) {
    //   return this.props.settings.languages.includes(song.lang);
    // }, this);
    if (strippedSearch == "") {
      console.log("no search detected.");
      searchResults = songs.slice(0, this.state.rowLimit).map(song => {
        return {
          song: song,
          tag: ""
        };
      });
    } else if (this.searchIsNumber()) {
      var search = parseInt(this.props.search);
      var refs = references.filter(ref => ref.index == search);
      searchResults = refs.map(ref => {
        var book = this.props.books.find(book => book.id == ref.book_id);
        return {
          song: songs.find(song => song.id == ref.song_id),
          tag:
            '<span class="search_tag">' +
            book.name +
            ": #" +
            ref.index +
            "</span>"
        };
      });
      return searchResults;
    } else {
      var titleStartRegex = new RegExp("^" + strippedSearch, "i");
      var titleMatchRegex = new RegExp(strippedSearch, "i");
      var lyricsMatchRegex = new RegExp(strippedSearch, "i");

      searchResults = songs
        .filter(song => {
          var title = stripString(song.title);
          var lyrics = stripString(song.lyrics);
          return titleMatchRegex.test(title) || lyricsMatchRegex.test(lyrics);
        }, this)
        .map(song => {
          return {
            song: song,
            tag: ""
          };
        });

      // sort the results, making title matches appear higher than lyrics matches
      searchResults.sort((a, b) => {
        var titles = [stripString(a.song.title), stripString(b.song.title)];
        var weights = titles.map(title => {
          if (titleStartRegex.test(title)) {
            return 2;
          } else if (titleMatchRegex.test(title)) {
            return 1;
          } else {
            return 0;
          }
        });

        // sort alphabetically if they are in the same regex category
        if (weights[0] == weights[1]) {
          if (titles[0] < titles[1]) return -1;
          if (titles[0] > titles[1]) return 1;
          return 0;
        } else {
          return weights[1] - weights[0];
        }
      });
    }

    return searchResults.slice(0, this.state.rowLimit);
  }

  render() {
    getKeysByValue = function(object, value) {
      return Object.keys(object).filter(key => object[key] === value);
    };

    return (
      <div className="song-index" key="song-index">
        <BookButton toggleBookIndex={this.props.toggleBookIndex} inBook={!!this.props.currentBook}/>
        <div className="settings-btn" onClick={this.props.toggleSettingsPage}>
          <SettingsIcon />
        </div>
        <div className="search-form form" key="search-form">
          <input
            id="index_search"
            autoComplete="off"
            value={this.props.search}
            onChange={this.searchInputChange}
            name="song[search]"
            className="index_search"
            placeholder="search..."
            key="search-input"
          />
          {this.props.search.length > 0 ? (
            <div className="btn_clear_search" onClick={this.props.clearSearch}>
              ×
            </div>
          ) : null}
        </div>
        <div className="title-list">
          {!!this.props.loading_data ? (
            <div className="loading">Loading song data...</div>
          ) : (
            this.getSearchResults().map(function(result, i) {
              var id = result.song.id;
              if(!!this.props.currentBook) {
                id = this.props.references.find(ref =>
                  ref.song_id === result.song.id &&
                  ref.book_id === this.props.currentBook.id
                ).index
              }
              return (
                <div
                  className="index_row"
                  key={i}
                  id={id}
                  onClick={this.props.setSong}
                >
                  <span className="index_row_title">{result.song.title}</span>
                  <span
                    className="index_row_tag"
                    dangerouslySetInnerHTML={{ __html: result.tag }}
                  />
                </div>
              );
            }, this)
          )}
        </div>
      </div>
    );
  }
}
