class AdminBookForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search: "",
      book: {
        name: props.book.name || "",
        songs: props.book.songs || {},
        languages: props.book.languages || [],
      },
      songs: [],
      loading: false,
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleAddSong = this.handleAddSong.bind(this);
    this.handleRemoveSong = this.handleRemoveSong.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.handleBookTitle = this.handleBookTitle.bind(this);
    this.searchTimeout = null;

    // Initial load
    this.searchSongs("");
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
    const search = e.target.value;
    this.setState({ search });

    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.searchSongs(search);
    }, 300);
  }

  searchSongs(search) {
    this.setState({ loading: true });

    const csrfToken = document.querySelector("meta[name=csrf-token]").content);
    const searchParams = new URLSearchParams({ search });

    fetch("/api/v2/custom_book_search?" + searchParams.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      }
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          songs: data.songs,
          loading: false
        });
      })
      .catch(error => {
        console.error("Error:", error);
        this.setState({ loading: false });
      });
  }

  handleAddSong(song) {
    this.setState((prevState) => {
      const songs = { ...prevState.book.songs };
      if (song.id in songs) return null;

      songs[song.id] = String(Object.keys(songs).length + 1);
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
      .sort((a, b) => parseInt(songObject[a]) - parseInt(songObject[b]))
      .reduce((acc, id, index) => {
        acc[id] = String(index + 1);
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

    const songEntries = Object.entries(this.state.book.songs)
      .sort((a, b) => parseInt(a[1]) - parseInt(b[1]));
    const [dragged] = songEntries.splice(dragIndex, 1);
    songEntries.splice(dropIndex, 0, dragged);

    const reordered = songEntries.reduce((acc, [id], i) => {
      acc[id] = String(i + 1);
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
      .sort(([, aIndex], [, bIndex]) => parseInt(aIndex) - parseInt(bIndex))
      .map(([songId, index]) => ({
        song: allSongs.find((s) => s.id === parseInt(songId)),
        index: index
      }))
      .filter(({ song }) => song);
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
    // Server handles search and sorting
    return songs.slice(0, 100);
  }

  render() {
    const { search, book, songs, loading } = this.state;
    const bookSongs = this.getOrderedBookSongs(book, songs);

    const filteredSongs = this.filterAndSortSongs(songs, search);

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
              </div>
              {loading ? (
                <div className="songs">Loading...</div>
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
                {bookSongs.map(({ song, index: bookIndex }, arrayIndex) => {
                  if (!song.title.toLowerCase().includes(search.toLowerCase())) return null;
                  return (
                    <div
                      className="song-item"
                      key={song.id}
                      draggable
                      onDragStart={(e) => this.handleDragStart(e, arrayIndex)}
                      onDrop={(e) => this.handleDrop(e, arrayIndex)}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      #{bookIndex} {song.title}
                      <button type="button" onClick={() => this.handleRemoveSong(bookIndex)}>
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
            placeholder="Book Title"
            key="search-input"
          />
        </div>
        <input type="hidden" name="book[songs]" value={JSON.stringify(book.songs || {})} />
        <input type="hidden" name="book[languages]" value={JSON.stringify(book.languages || [])} />
      </div>
    );
  }
}
