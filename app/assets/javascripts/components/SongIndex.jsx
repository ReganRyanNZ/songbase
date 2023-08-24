class SongIndex extends React.Component {
  constructor(props) {
    super(props);

    this.getSearchResults = this.getSearchResults.bind(this);
    this.songIndexRow = this.songIndexRow.bind(this);
    this.songs = this.songs.bind(this);
    this.strip = this.strip.bind(this);
    this.rowDataForNumericalSearch = this.rowDataForNumericalSearch.bind(this);
    this.sortRowData = this.sortRowData.bind(this);
    this.keyNavigate = this.keyNavigate.bind(this);

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

  strip(string) {
    return string.replace(/[\_\-—–]/g, " ")
                 .normalize("NFD")
                 .toUpperCase()
                 .replace(/(\[.+?\])|[’'",“!?()\[\]]|[\u0300-\u036f]/g, "");
  }



  songs() {
    let results = this.props.songs;

    // scope songs to the current selected book
    if (this.props.currentBook) {
      results = results.filter(song => this.props.currentBook.songs[song.id]);
    }
    return results;
  }

  rowDataForNumericalSearch(number) {
    let books = this.props.currentBook ? [this.props.currentBook] : this.props.books;
    let booksWithIndex = books.map(book => {
      let song_id = this.props.getSongIdFromBook(book, number);
      return song_id ? [book, song_id] : null;
    }).filter(notNull => notNull);

    return booksWithIndex.map(bookAndSongId => {
      let book = bookAndSongId[0];
      let song_id = bookAndSongId[1];

      return {
        song: this.props.songs.find(song => song.id == song_id),
        tag:
          '<span class="search_tag">' +
          book.name +
          ": #" +
          number +
          "</span>"
      };
    });
  }

  getSearchResults() {
    if (this.props.songs.length === 0) { return [] }

    let strippedSearch = this.strip(this.props.search);
    let rowData = [];

    if (this.searchIsNumber()) {
      rowData = this.rowDataForNumericalSearch(strippedSearch);
    } else {
      let containsSearchRegex = new RegExp(strippedSearch, "i");
      let toRowData = (song) => { return { song: song, tag: "" } };
      let songContainsSearch = (song) => {
        let title = this.strip(song.title);
        let lyrics = this.strip(song.lyrics);
        return containsSearchRegex.test(title) || containsSearchRegex.test(lyrics);
      };
      let searchResults = this.songs().filter(songContainsSearch).map(toRowData);
      rowData = searchResults;
    }

    return this.sortRowData(rowData, strippedSearch).slice(0, this.props.rowLimit);
  }

  sortRowData(rows, search) {
    let titleStartRegex = new RegExp("^" + search, "i");
    let titleMatchRegex = new RegExp(search, "i");

    if (this.props.currentBook && this.props.orderIndexBy == 'number') {
      return rows.sort((a, b) => {
        let index_a = this.props.currentBook.songs[a.song.id];
        let index_b = this.props.currentBook.songs[b.song.id];
        return parseInt(index_a) > parseInt(index_b) ? 1 : -1;
      });
    } else {
      return rows.sort((a, b) => {
        let titles = [this.strip(a.song.title), this.strip(b.song.title)];
        let titlesImportance = titles.map(title => {
          if (titleStartRegex.test(title)) {
            return 2; // Matching the start of the title
          } else if (titleMatchRegex.test(title)) {
            return 1; // Matching the title
          } else {
            return 0; // Matching the lyrics
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

  keyNavigate(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const insideSearch = e.currentTarget.tagName == 'DIV';
      let sibling;

      if (e.key === 'ArrowDown') {
        const listTop = document.querySelector(".title-list > button:first-of-type");
        sibling = insideSearch ? listTop : e.currentTarget.nextSibling;
      }
      if (e.key === 'ArrowUp') {
        const listBottom = document.querySelector(".title-list > button:last-of-type");
        sibling = insideSearch ? listBottom : e.currentTarget.previousSibling;
      }

      if (sibling) {
        sibling.focus();
      } else {
        document.querySelector("#index_search").focus(); // end of list, go back to search input
      }
    }
  }

  // html component for a row on the index page
  songIndexRow(rowData, i) {
    let bookIndex = this.props.currentBook ? this.props.currentBook.songs[rowData.song.id] : null
    let id = bookIndex || rowData.song.id;
    let bookIndexTag = '';

    if (this.props.currentBook) {
      bookIndexTag = <div className="index_row_book_index">{id}</div>;
      rowData.tag = '';
    }

    return (
      <button
        className="index_row"
        key={i}
        id={id}
        onClick={this.props.setSong}
        onKeyDown={this.keyNavigate}
      >
        <div className="index_row_title">
          {rowData.song.title}
          {bookIndexTag}
        </div>
        <div
          className="index_row_tag"
          dangerouslySetInnerHTML={{ __html: rowData.tag }}
        />
      </button>
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
        <div className="search-form form" key="search-form" onKeyDown={this.keyNavigate}>
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
