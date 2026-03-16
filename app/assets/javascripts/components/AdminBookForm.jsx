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
    var name = e.target.value;
    this.setState(function(prevState) {
      return {
        book: Object.assign({}, prevState.book, { name: name })
      };
    });
  }

  handleSearchChange(e) {
    var search = e.target.value;
    this.setState({ search: search });

    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search
    this.searchTimeout = setTimeout(function() {
      this.searchSongs(search);
    }.bind(this), 300);
  }

  searchSongs(search) {
    this.setState({ loading: true });

    var csrfToken = document.querySelector("meta[name='csrf-token']").content;
    var searchUrl = "/api/v2/custom_book_search?search=" + encodeURIComponent(search);

    fetch(searchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      }
    })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        this.setState({
          songs: data.songs,
          loading: false
        });
      }.bind(this))
      .catch(function(error) {
        console.error("Error:", error);
        this.setState({ loading: false });
      }.bind(this));
  }

  handleAddSong(song) {
    this.setState(function(prevState) {
      var songs = Object.assign({}, prevState.book.songs);
      if (song.id in songs) return null;

      songs[song.id] = String(Object.keys(songs).length + 1);
      var languages = this.getUpdatedLanguages(songs);

      return {
        book: Object.assign({}, prevState.book, { songs: songs, languages: languages }),
      };
    });
  }

  getUpdatedLanguages(songsMap) {
    var allSongs = this.state.songs || [];
    var languageSet = {};

    Object.keys(songsMap).forEach(function(id) {
      var song = allSongs.find(function(s) { return String(s.id) === String(id); });
      if (song) {
        var lang = song.lang || song.language;
        if (lang) languageSet[lang] = true;
      }
    });

    return Object.keys(languageSet);
  }

  reorderSongObject(songObject) {
    var orderedKeys = Object.keys(songObject).sort(function(a, b) {
      return parseInt(songObject[a]) - parseInt(songObject[b]);
    });

    var result = {};
    orderedKeys.forEach(function(id, index) {
      result[id] = String(index + 1);
    });
    return result;
  }

  clearSearch() {
    this.setState({ search: "" });
    var input = document.getElementById("index_search");
    if (input) input.focus();
  }

  handleRemoveSong(index) {
    this.setState(function(prevState) {
      var songs = Object.assign({}, prevState.book.songs);
      var songIdToRemove = Object.keys(songs).find(function(id) { return songs[id] === index; });

      if (songIdToRemove === undefined) return null;

      delete songs[songIdToRemove];
      var reordered = this.reorderSongObject(songs);
      var languages = this.getUpdatedLanguages(reordered);

      return {
        book: Object.assign({}, prevState.book, { songs: reordered, languages: languages }),
      };
    });
  }

  handleDragStart(e, index) {
    e.dataTransfer.setData("dragIndex", index);
  }

  handleDrop(e, dropIndex) {
    e.preventDefault();
    var dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);

    var songEntries = Object.entries(this.state.book.songs)
      .sort(function(a, b) { return parseInt(a[1]) - parseInt(b[1]); });
    var dragged = songEntries.splice(dragIndex, 1);
    songEntries.splice(dropIndex, 0, dragged[0]);

    var reordered = {};
    songEntries.forEach(function(entry, i) {
      reordered[entry[0]] = String(i + 1);
    });

    this.setState(function(prevState) {
      return {
        book: Object.assign({}, prevState.book, { songs: reordered }),
      };
    });
  }

  getOrderedBookSongs(book, allSongs) {
    if (!book.songs) return [];

    return Object.entries(book.songs)
      .sort(function(a, b) { return parseInt(a[1]) - parseInt(b[1]); })
      .map(function(entry) {
        var song = allSongs.find(function(s) { return s.id === parseInt(entry[0]); });
        return { song: song, index: entry[1] };
      })
      .filter(function(item) { return item.song; });
  }

  strip(string, normalize) {
    normalize = normalize !== false;
    var result = normalize ? string.normalize("NFD") : string;

    return result
      .replace(/[\_\-—–]/g, " ")
      .toUpperCase()
      .replace(/\n/g, " ")
      .replace(/(\[.+?\])|[’'",“!?()\[\]]|[\u0300-\u036f]/g, "");
  }

  filterAndSortSongs(songs, search) {
    // Server handles search and sorting
    return songs.slice(0, 100);
  }

  render() {
    var search = this.state.search;
    var book = this.state.book;
    var songs = this.state.songs;
    var loading = this.state.loading;
    var bookSongs = this.getOrderedBookSongs(book, songs);
    var filteredSongs = this.filterAndSortSongs(songs, search);

    return React.createElement("div", { className: "admin-book-form" },
      React.createElement("div", { className: "book-songs-form-container" },
        React.createElement("div", { className: "search-form form", key: "search-form" },
          React.createElement("input", {
            id: "index_search",
            autoComplete: "off",
            value: search,
            onChange: this.handleSearchChange,
            name: "search",
            className: "index_search",
            placeholder: "search...",
            key: "search-input"
          }),
          search.length > 0 ? React.createElement("div", {
            className: "btn_clear_search",
            onClick: this.clearSearch
          }, "×") : null
        ),
        React.createElement("div", { className: "songs-container" },
          React.createElement("div", { className: "songs-search-container" },
            React.createElement("div", { className: "songs-header" },
              React.createElement("h3", null, "Songbase Songs")
            ),
            loading ? React.createElement("div", { className: "songs" }, "Loading...") :
            React.createElement("div", { className: "songs" },
              filteredSongs.map(function(song) {
                return React.createElement("div", { className: "song-item", key: song.id },
                  song.title,
                  React.createElement("button", {
                    type: "button",
                    onClick: function() { this.handleAddSong(song); }.bind(this)
                  }, "Add")
                );
              }, this)
            )
          ),
          React.createElement("div", { className: "book-songs-container" },
            React.createElement("h3", null, "Book Songs"),
            React.createElement("div", { className: "book-songs" },
              bookSongs.map(function(songData, arrayIndex) {
                var song = songData.song;
                var bookIndex = songData.index;
                if (!song.title.toLowerCase().includes(search.toLowerCase())) return null;
                return React.createElement("div", {
                  className: "song-item",
                  key: song.id,
                  draggable: true,
                  onDragStart: function(e) { this.handleDragStart(e, arrayIndex); }.bind(this),
                  onDrop: function(e) { this.handleDrop(e, arrayIndex); }.bind(this),
                  onDragOver: function(e) { e.preventDefault(); }
                },
                  "#" + bookIndex + " " + song.title,
                  React.createElement("button", {
                    type: "button",
                    onClick: function() { this.handleRemoveSong(bookIndex); }.bind(this)
                  }, "Remove")
                );
              }, this)
            )
          )
        )
      ),
      React.createElement("div", { className: "book-title" },
        React.createElement("h2", null, "Book title"),
        React.createElement("input", {
          id: "book_title",
          autoComplete: "off",
          value: book.name,
          onChange: this.handleBookTitle,
          name: "book[name]",
          className: "book-form-title",
          placeholder: "Book Title",
          key: "search-input"
        }),
        React.createElement("input", {
          type: "hidden",
          name: "book[songs]",
          value: JSON.stringify(book.songs || {})
        }),
        React.createElement("input", {
          type: "hidden",
          name: "book[languages]",
          value: JSON.stringify(book.languages || [])
        })
      )
    );
  }
}
