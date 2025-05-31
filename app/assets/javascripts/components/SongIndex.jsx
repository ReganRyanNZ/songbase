class SongIndex extends React.Component {
  constructor(props) {
    super(props);

    window.addEventListener('scroll', this.props.infiniteScrolling);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.props.infiniteScrolling);
  }

  strip(string, normalize=true) {
    // Normalize is optional for performance reasons. We don't want to
    // normalize song data because it should already exist normalized. We _do_
    // want to normalize e.g. user search input, to match our data.
    let result = normalize ? string.normalize("NFD") : string

    result = result.replace(/[\_\-—–]/g, " ")
                   .toUpperCase()
                   .replaceAll("\n", " ")
                   .replace(/(\[.+?\])|[’'",“!?()\[\]]|[\u0300-\u036f]/g, "");

    return result
  }

  songs() {
    let results = this.props.songs;

    // scope songs to the current selected book
    if (this.props.currentBook) {
      let bookIndex = this.props.currentBook.songs;
      results = results.filter(song => bookIndex[song.id]);
    } else {
      // scope songs to the languages in settings
      let languages = this.props.settings.languages;
      results = results.filter(song => languages.includes(song.lang));
    }
    return results;
  }

  rowDataForNumericalSearch(number) {
    let books = this.props.currentBook ? [this.props.currentBook] : this.props.books;
    let languages = this.props.settings.languages;
    books = books.filter(book =>
      book.languages.some(lang => languages.includes(lang))
    );
    let booksWithIndex = books.map(book => {
                                    let song_id = this.props.getSongIdFromBook(book, number);
                                    return song_id ? [book, song_id] : null;
                                  }).filter(notNull => notNull);

    return booksWithIndex.map(bookAndSongId => {
      let book = bookAndSongId[0];
      let song_id = bookAndSongId[1];
      let song = this.props.songs.find(song => song.id == song_id);
      if (!song) { return null }
      return {
        song: song,
        tag:
          '<span class="search_tag">' +
          book.name +
          ": #" +
          number +
          "</span>"
      };
    }).filter(notNull => notNull);;
  }

  // Returns an array of {song: song, tag: tag} objects
  getSearchResults() {
    if (this.props.songs.length === 0) { return [] }

    let strippedSearch = this.strip(this.props.search);
    let rowData = [];

    let searchIsNumber = /^[0-9]+$/i.test(this.props.search);
    if (searchIsNumber) {
      // If search is a number, we can look for book index instead of title/lyrics
      rowData = this.rowDataForNumericalSearch(strippedSearch);
    } else {
      let containsSearchRegex = new RegExp(strippedSearch);
      let toRowData = (song) => { return { song: song, tag: "" } };
      let songContainsSearch = (song) => {
        let title = this.strip(song.title, false);
        let lyrics = this.strip(song.lyrics, false);
        return containsSearchRegex.test(title) || containsSearchRegex.test(lyrics);
      };
      let searchResults = this.songs().filter(songContainsSearch);
      rowData = searchResults.map(toRowData);
    }

    return this.sortRowData(rowData, strippedSearch).slice(0, this.props.rowLimit);
  }

  sortRowData(rows, search) {
    let titleStartRegex = new RegExp("^" + search, 'i');
    let titleMatchRegex = new RegExp(search, 'i');

    if (this.props.currentBook && this.props.orderIndexBy == 'number') {
      let bookIndex = this.props.currentBook.songs;
      return rows.sort((a, b) => {
        return parseInt(bookIndex[a.song.id]) > parseInt(bookIndex[b.song.id]) ? 1 : -1;
      });
    } else {
      return rows.sort((a, b) => {
        let titles = [this.strip(a.song.title), this.strip(b.song.title)];
        let titleSortValue = (title) => {
                                          if (titleStartRegex.test(title)) {
                                            return 2; // Matching the start of the title
                                          } else if (titleMatchRegex.test(title)) {
                                            return 1; // Matching the title
                                          } else {
                                            return 0; // Matching the lyrics
                                          }
                                        }
        let titlesImportance = titles.map(titleSortValue);
        if (titlesImportance[0] != titlesImportance[1]) {
          return titlesImportance[1] - titlesImportance[0];
        }

        // sort alphabetically if they are in the same importance category
        if (titlesImportance[0] == titlesImportance[1]) {
          if (titles[0] < titles[1]) return -1;
          if (titles[0] > titles[1]) return 1;
          return 0;
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
        className="index_row song_link"
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

          {(this.props.loadingData && this.props.songs.length == 0) ? (
            <div className="loading">Loading song data...</div>
          ) : (
            this.getSearchResults().map(this.songIndexRow, this)
          )}
        </div>
      </div>
    );
  }
}
