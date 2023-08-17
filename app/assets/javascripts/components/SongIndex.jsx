class SongIndex extends React.Component {
  constructor(props) {
    super(props);

    this.getSearchResults = this.getSearchResults.bind(this);
    this.songIndexRow = this.songIndexRow.bind(this);
    this.resultsForNumericalSearch = this.resultsForNumericalSearch.bind(this);

    window.addEventListener('scroll', this.props.infiniteScrolling);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.props.infiniteScrolling);
  }

  // If the search is a number, we can look for book indices instead of
  // title/lyric matches
  searchIsNumber() {
    let isNumberRegex = new RegExp("^[0-9]+$", "i");
    return isNumberRegex.test(this.props.search);
  }

  getSearchResults() {
    if (this.props.songs.length === 0) { return [] }

    let stripString = (str) => {
      return str.replace(/[\_\-—–]/g, " ")
                .normalize("NFD")
                .toUpperCase()
                .replace(/(\[.+?\])|[’'",“!?()\[\]]|[\u0300-\u036f]/g, "")
    };
    let songs = this.props.songs;
    let references = this.props.references;

    // scope songs to the current selected book
    if (this.props.currentBook != null) {
      // #TODO REFERENCES
      references = references.filter(ref => ref.book_id === this.props.currentBook.id)
      let song_ids = references.map(ref => ref.song_id);
      songs = songs.filter(song => song_ids.includes(song.id));
    }

    let strippedSearch = stripString(this.props.search);
    let searchResults = [];

    if (this.searchIsNumber()) {
      let search = parseInt(this.props.search);
      // #TODO REFERENCES
      let refs = references.filter(ref => ref.index == search);
      searchResults = refs.map(ref => {
        let book = this.props.books.find(book => book.id == ref.book_id);
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

      // return this.resultsForNumericalSearch(parseInt(this.props.search))
    } else {
      let titleStartRegex = new RegExp("^" + strippedSearch, "i");
      let titleMatchRegex = new RegExp(strippedSearch, "i");
      let lyricsMatchRegex = new RegExp(strippedSearch, "i");

      searchResults = songs
        .filter(song => {
          let title = stripString(song.title);
          let lyrics = stripString(song.lyrics);
          return titleMatchRegex.test(title) || lyricsMatchRegex.test(lyrics);
        }, this)
        .map(song => {
          return {
            song: song,
            tag: ""
          };
        });

      if (this.props.currentBook && this.props.orderIndexBy == 'number') {
        searchResults.sort((a, b) => {
          let index_a = references.find((ref) => (ref.song_id == a.song.id)).index;
          let index_b = references.find((ref) => (ref.song_id == b.song.id)).index;
          return parseInt(index_a) > parseInt(index_b) ? 1 : -1;
        });
      } else {
        // sort the results, making title matches appear higher than lyrics matches
        searchResults.sort((a, b) => {
          let titles = [stripString(a.song.title), stripString(b.song.title)];
          let titlesImportance = titles.map(title => {
            if (titleStartRegex.test(title)) {
              return 2;
            } else if (titleMatchRegex.test(title)) {
              return 1;
            } else {
              return 0;
            }
          });

          // sort alphabetically if they are in the same importance category
          if (titlesImportance[0] == titlesImportance[1]) {
            if (titles[0] < titles[1]) return -1;
            if (titles[0] > titles[1]) return 1;
            return 0;
          } else {
            return titlesImportance[1] - titlesImportance[0];
          }
        });
      }
    }

    return searchResults.slice(0, this.props.rowLimit);
  }

  resultsForNumericalSearch(searchTerm) {
    // #TODO REFERENCES
    let refs = references.filter(ref => ref.index == searchTerm);
    searchResults = refs.map(ref => {
      let book = this.props.books.find(book => book.id == ref.book_id);
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
  }

  // html component for a row on the index page
  songIndexRow (result, i) {
    let id = result.song.id,
        index_tag = '';

    if (!!this.props.currentBook) {
      id = this.props.references.find(ref =>
        ref.song_id === result.song.id &&
        ref.book_id === this.props.currentBook.id
      ).index
      index_tag = <div className="index_row_book_index">{id}</div>;
      result.tag = '';
    }
    return (
      <div
        className="index_row"
        key={i}
        id={id}
        onClick={this.props.setSong}
      >
        <div className="index_row_title">
          {result.song.title}
          {index_tag}
        </div>
        <div
          className="index_row_tag"
          dangerouslySetInnerHTML={{ __html: result.tag }}
        />
      </div>
    );
  }

  render() {
    let searchInputChange = (event) => { this.props.setSearch(event.target.value); }

    return (
      <div className="song-index" key="song-index">
        <BookButton toggleBookIndex={this.props.toggleBookIndex} inBook={!!this.props.currentBook} />
        <div className="settings-btn" onClick={this.props.toggleSettingsPage}>
          <SettingsIcon />
        </div>
        <div className="search-form form" key="search-form">
          <input
            id="index_search"
            autoComplete="off"
            value={this.props.search}
            onChange={searchInputChange}
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
          {!!this.props.currentBook ? (
            <div className="btn-sort" onClick={this.props.toggleOrderIndexBy}>
              <SortIcon />
            </div>) : null}

          {!!this.props.loadingData ? (
            <div className="loading">Loading song data...</div>
          ) : (
            this.getSearchResults().map(this.songIndexRow, this)
          )}
        </div>
      </div>
    );
  }
}
