class AdminBookForm extends React.Component {
  constructor(props) {
    super(props);
    const languages = Array.from(
      new Set(
        props.books
          .map((book) => book.languages)
          .filter(Boolean)
          .flat()
      )
    );
    this.state = {
      search: "",
      newBook: props.newBook || [],
      books: props.books || [],
      languages: languages || [],
      songs: props.songs || [],
      showLanguageFilter: false,
      activeLanguages: ["english"],
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleAddSong = this.handleAddSong.bind(this);
    this.handleRemoveSong = this.handleRemoveSong.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.toggleLanguageFilter = this.toggleLanguageFilter.bind(this);
    this.toggleLanguage = this.toggleLanguage.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
  }

  handleSearchChange(e) {
    this.setState({ search: e.target.value });
  }

  handleAddSong(song) {
    this.setState((prevState) => {
      const newBook = { ...prevState.newBook };
      const songs = { ...newBook.songs };

      if (!(song.id in songs)) {
        const nextIndex = Object.keys(songs).length;
        songs[song.id] = nextIndex;

        return {
          newBook: {
            ...newBook,
            songs,
          },
        };
      }

      return null;
    });
  }

  reorderSongObject(songObject) {
    return Object.keys(songObject)
      .sort((a, b) => songObject[a] - songObject[b])
      .reduce((acc, id, index) => {
        acc[id] = index;
        return acc;
      }, {});
  }
  
  clearSearch() {
    this.setState({ search: "" });
    document.getElementById("index_search").focus();
  }

  handleRemoveSong(index) {
    this.setState((prevState) => {
      const songs = { ...prevState.newBook.songs };
      const songIdToRemove = Object.keys(songs).find((id) => songs[id] === index);

      if (songIdToRemove !== undefined) {
        delete songs[songIdToRemove];
        const reordered = reorderSongObject(songs);

        return {
          newBook: {
            ...prevState.newBook,
            songs: reordered,
          },
        };
      }

      return null;
    });
  }

  handleDragStart(e, index) {
    e.dataTransfer.setData("dragIndex", index);
  }

  handleDrop(e, dropIndex) {
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
    const songEntries = Object.entries(this.state.newBook.songs).sort((a, b) => a[1] - b[1]);

    const [dragged] = songEntries.splice(dragIndex, 1);
    songEntries.splice(dropIndex, 0, dragged);

    const reordered = songEntries.reduce((acc, [id], i) => {
      acc[id] = i;
      return acc;
    }, {});

    this.setState((prevState) => ({
      newBook: {
        ...prevState.newBook,
        songs: reordered,
      },
    }));
  }
  getOrderedBookSongs(book, allSongs) {
    if (!book || !book.songs) return [];

    const songIdIndexMap = book.songs;

    const sortedSongIds = Object.entries(songIdIndexMap)
      .sort(([, indexA], [, indexB]) => indexA - indexB)
      .map(([songId]) => parseInt(songId));

    return sortedSongIds.map((id) => allSongs.find((s) => s.id === id)).filter(Boolean);
  }

  strip(string, normalize = true) {
    let result = normalize ? string.normalize("NFD") : string;

    result = result
      .replace(/[\_\-—–]/g, " ")
      .toUpperCase()
      .replaceAll("\n", " ")
      .replace(/(\[.+?\])|[’'",“!?()\[\]]|[\u0300-\u036f]/g, "");

    return result;
  }
  filterAndSortSongs(songs, search) {
    const strippedSearch = this.strip(search);
    const titleStartsWithSearch = new RegExp("^" + strippedSearch, "i");
    const titleContainsSearch = new RegExp(strippedSearch, "i");

    return songs
      .filter((song) => {
        const strippedTitle = this.strip(song.title);
        const matchesTitle = titleContainsSearch.test(strippedTitle);
        const matchesLanguage = this.state.activeLanguages.includes(song.lang);
        return matchesTitle && matchesLanguage;
      })
      .sort((a, b) => {
        const titleA = this.strip(a.title);
        const titleB = this.strip(b.title);

        const getRelevance = (title) => {
          if (titleStartsWithSearch.test(title)) return 2;
          if (titleContainsSearch.test(title)) return 1;
          return 0;
        };

        const relevanceA = getRelevance(titleA);
        const relevanceB = getRelevance(titleB);

        if (relevanceA !== relevanceB) {
          return relevanceB - relevanceA;
        }

        return titleA.localeCompare(titleB);
      });
  }
  toggleLanguageFilter() {
    this.setState((prevState) => ({
      showLanguageFilter: !prevState.showLanguageFilter,
    }));
  }

  toggleLanguage(lang) {
    this.setState((prevState) => {
      const isActive = prevState.activeLanguages.includes(lang);
      const activeLanguages = isActive ? prevState.activeLanguages.filter((l) => l !== lang) : [...prevState.activeLanguages, lang];

      return { activeLanguages };
    });
  }

  render() {
    const { search, newBook, songs, languages, showLanguageFilter, activeLanguages } = this.state;
    const newBookSongs = this.getOrderedBookSongs(newBook, songs);

    const filteredSongs = this.filterAndSortSongs(songs, search).slice(0, 25);

    const filterBookSongs = newBookSongs.filter((song) => song.title.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="admin-book-form">
        <div className="search-form form" key="search-form">
          <input
            id="index_search"
            autoComplete="off"
            value={search}
            onChange={this.handleSearchChange}
            name="song[search]"
            className="index_search"
            placeholder="search..."
            key="search-input"
          />
          {search.length > 0 ? (
            <div className="btn_clear_search" onClick={this.clearSearch}>
              ×
            </div>
          ) : null}
        </div>

        <div className="songs-container">
          <div className="songs-search-container">
            <div className="songs-header">
              <h3>Songbase Songs</h3>
              <button onClick={this.toggleLanguageFilter} className="book-langauge-filter">
                <GlobeIcon />
              </button>
            </div>
            {showLanguageFilter ? (
              <div className="language-filter">
                {languages.map((lang) => {
                  const capitalizedLang = lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();

                  return (
                    <label key={lang}>
                      <input type="checkbox" checked={activeLanguages.includes(lang)} onChange={() => this.toggleLanguage(lang)} />
                      {capitalizedLang}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="songs">
                {filteredSongs.map((song) => (
                  <div className="song-item" key={song.id}>
                    {song.title}
                    <button onClick={() => this.handleAddSong(song)}>Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="book-songs-container">
            <h3>Book Songs</h3>
            <div className="book-songs"></div>
            {filterBookSongs.map((song, index) => (
              <div
                className="song-item"
                key={song.id}
                draggable
                onDragStart={(e) => this.handleDragStart(e, index)}
                onDrop={(e) => this.handleDrop(e, index)}
                onDragOver={(e) => e.preventDefault()}
              >
                #{index + 1} {song.title}
                <button onClick={() => this.handleRemoveSong(index)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
