class AdminBookForm extends React.Component {
  constructor(props) {
    super(props);

    const languages = Array.from(
      new Set(
        props.songs
          .map((song) => song.lang)
          .filter(Boolean)
          .flat()
      )
    );

    this.state = {
      search: "",
      book: {
        name: props.book.name || "",
        songs: props.book.songs || {},
        languages: props.book.languages || [],
        owners: props.book.owners || [],
      },
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
    this.handleBookTitle = this.handleBookTitle.bind(this);
  }

  handleBookTitle(e) {
    const name = e.target.value;
    this.setState((prevState) => ({
      book: {
        ...prevState.book,
        name,
      },
    }));
  }

  handleSearchChange(e) {
    this.setState({ search: e.target.value });
  }

  handleAddSong(song) {
    this.setState((prevState) => {
      const songs = { ...prevState.book.songs };
      if (song.id in songs) return null;

      songs[song.id] = Object.keys(songs).length;
      const languages = this.getUpdatedLanguages(songs);

      return {
        book: {
          ...prevState.book,
          songs,
          languages,
        },
      };
    });
  }

  getUpdatedLanguages(songsMap) {
    const allSongs = this.state.songs || [];

    const languages = Object.keys(songsMap)
      .map((id) => {
        const song = allSongs.find((s) => String(s.id) === String(id));
        return song && (song.lang || song.language); // support either
      })
      .filter(Boolean);

    return Array.from(new Set(languages));
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
    const input = document.getElementById("index_search");
    if (input) input.focus();
  }

  handleRemoveSong(index) {
    this.setState((prevState) => {
      const songs = { ...prevState.book.songs };
      const songIdToRemove = Object.keys(songs).find((id) => songs[id] === index);

      if (songIdToRemove === undefined) return null;

      delete songs[songIdToRemove];
      const reordered = this.reorderSongObject(songs);
      const languages = this.getUpdatedLanguages(reordered);

      return {
        book: {
          ...prevState.book,
          songs: reordered,
          languages,
        },
      };
    });
  }

  handleDragStart(e, index) {
    e.dataTransfer.setData("dragIndex", index);
  }

  handleDrop(e, dropIndex) {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);

    const songEntries = Object.entries(this.state.book.songs).sort((a, b) => a[1] - b[1]);
    const [dragged] = songEntries.splice(dragIndex, 1);
    songEntries.splice(dropIndex, 0, dragged);

    const reordered = songEntries.reduce((acc, [id], i) => {
      acc[id] = i;
      return acc;
    }, {});

    this.setState((prevState) => ({
      book: {
        ...prevState.book,
        songs: reordered,
      },
    }));
  }

  getOrderedBookSongs(book, allSongs) {
    if (!book.songs) return [];

    return Object.entries(book.songs)
      .sort(([, aIndex], [, bIndex]) => aIndex - bIndex)
      .map(([songId]) => allSongs.find((s) => s.id === parseInt(songId)))
      .filter(Boolean);
  }

  strip(string, normalize = true) {
    let result = normalize ? string.normalize("NFD") : string;

    return result
      .replace(/[\_\-—–]/g, " ")
      .toUpperCase()
      .replaceAll("\n", " ")
      .replace(/(\[.+?\])|[’'",“!?()\[\]]|[\u0300-\u036f]/g, "");
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

        const relevance = (title) => {
          if (titleStartsWithSearch.test(title)) return 2;
          if (titleContainsSearch.test(title)) return 1;
          return 0;
        };

        const relevanceA = relevance(titleA);
        const relevanceB = relevance(titleB);

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
      const activeLanguages = prevState.activeLanguages.includes(lang) ? prevState.activeLanguages.filter((l) => l !== lang) : [...prevState.activeLanguages, lang];

      return { activeLanguages };
    });
  }

  render() {
    const { search, book, songs, languages, showLanguageFilter, activeLanguages } = this.state;
    const bookSongs = this.getOrderedBookSongs(book, songs);

    const filteredSongs = this.filterAndSortSongs(songs, search).slice(0, 100);

    return (
      <div className="admin-book-form">
        <div className="book-songs-form-container">
          <div className="search-form form" key="search-form">
            <input
              id="index_search"
              autoComplete="off"
              value={search}
              onChange={this.handleSearchChange}
              name="search"
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
                <button type="button" onClick={this.toggleLanguageFilter} className="book-langauge-filter">
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
                      <button type="button" onClick={() => this.handleAddSong(song)}>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="book-songs-container">
              <h3>Book Songs</h3>
              <div className="book-songs">
                {bookSongs.map((song, index) => {
                  if (!song.title.toLowerCase().includes(search.toLowerCase())) return null;
                  return (
                    <div
                      className="song-item"
                      key={song.id}
                      draggable
                      onDragStart={(e) => this.handleDragStart(e, index)}
                      onDrop={(e) => this.handleDrop(e, index)}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      #{index + 1} {song.title}
                      <button type="button" onClick={() => this.handleRemoveSong(index)}>
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="book-title">
          <h2>Book title</h2>
          <input
            id="book_title"
            autoComplete="off"
            value={book.name}
            onChange={this.handleBookTitle}
            name="book[name]"
            className="book-form-title"
            placeholder="Book Title (eg NZ Easter Conference 2025"
            key="search-input"
          />
        </div>
        <input type="hidden" name="book[songs]" value={JSON.stringify(book.songs || {})} />
        <input type="hidden" name="book[languages]" value={JSON.stringify(book.languages || [])} />
      </div>
    );
  }
}
