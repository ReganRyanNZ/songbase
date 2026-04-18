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
      dragIndex: null,
      dragOverIndex: null,
      // Touch drag state
      touchStartY: null,
      touchCurrentIndex: null,
      touchClone: null,
      touchScrollContainer: null,
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleAddSong = this.handleAddSong.bind(this);
    this.handleRemoveSong = this.handleRemoveSong.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.handleBookTitle = this.handleBookTitle.bind(this);
    this.searchTimeout = null;

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

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

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
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("dragIndex", index);
    this.setState({ dragIndex: index });
  }

  handleDragEnd(e) {
    this.setState({ dragIndex: null, dragOverIndex: null });
  }

  handleDragOver(e, index) {
    e.preventDefault();
    this.setState({ dragOverIndex: index });
  }

  handleDrop(e, dropIndex) {
    e.preventDefault();
    var dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
    if (dragIndex === dropIndex) {
      this.setState({ dragIndex: null, dragOverIndex: null });
      return;
    }

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
        dragIndex: null,
        dragOverIndex: null,
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

  filterAndSortSongs(songs, search) {
    return songs.slice(0, 100);
  }

  handleTouchStart(e, index) {
    // Only start drag from the drag handle
    if (!e.target.closest('.drag-handle')) return;

    this._touchDragIndex = index;
    this._touchStartY = e.touches[0].clientY;
    this._touchStarted = false;
    this._touchTarget = e.currentTarget;
  }

  handleTouchMove(e, index) {
    if (this._touchDragIndex === undefined) return;
    var touch = e.touches[0];
    var deltaY = Math.abs(touch.clientY - this._touchStartY);

    // Require 10px movement before starting drag (to distinguish from scroll)
    if (!this._touchStarted && deltaY < 10) return;

    if (!this._touchStarted) {
      this._touchStarted = true;
      e.preventDefault(); // Prevent scrolling once drag starts
      this.setState({ dragIndex: this._touchDragIndex });
      if (this._touchTarget) this._touchTarget.classList.add('dragging');
    }

    if (this._touchStarted) {
      e.preventDefault();

      // Find which item we're over
      var items = document.querySelectorAll('.book-songs .song-item');
      var newIndex = this._touchDragIndex;
      for (var i = 0; i < items.length; i++) {
        var rect = items[i].getBoundingClientRect();
        if (touch.clientY < rect.top + rect.height / 2) {
          newIndex = i;
          break;
        }
        if (i === items.length - 1) {
          newIndex = i;
        }
      }
      if (newIndex !== this.state.dragOverIndex) {
        this.setState({ dragOverIndex: newIndex });
      }
    }
  }

  handleTouchEnd(e) {
    if (this._touchDragIndex === undefined) return;

    if (this._touchStarted) {
      if (this._touchTarget) this._touchTarget.classList.remove('dragging');
      this.handleDropAt(this._touchDragIndex, this.state.dragOverIndex);
    }

    this._touchDragIndex = undefined;
    this._touchStartY = undefined;
    this._touchStarted = false;
    this._touchTarget = undefined;
    this.setState({ dragIndex: null, dragOverIndex: null });
  }

  handleDropAt(fromIndex, toIndex) {
    if (fromIndex === undefined || toIndex === undefined || fromIndex === toIndex) return;

    var songEntries = Object.entries(this.state.book.songs)
      .sort(function(a, b) { return parseInt(a[1]) - parseInt(b[1]); });
    var dragged = songEntries.splice(fromIndex, 1);
    songEntries.splice(toIndex, 0, dragged[0]);

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

  render() {
    var self = this;
    var search = this.state.search;
    var book = this.state.book;
    var songs = this.state.songs;
    var loading = this.state.loading;
    var bookSongs = this.getOrderedBookSongs(book, songs);
    var filteredSongs = this.filterAndSortSongs(songs, search);
    var bookSongCount = Object.keys(book.songs || {}).length;

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
              React.createElement("h3", null, "Songbase Songs"),
              React.createElement("span", { className: "song-count" }, filteredSongs.length + " found")
            ),
            loading ? React.createElement("div", { className: "songs" }, "Loading...") :
            filteredSongs.length === 0 ? React.createElement("div", { className: "songs-empty" }, search.length > 0 ? "No songs found" : "Type to search") :
            React.createElement("div", { className: "songs" },
              filteredSongs.map(function(song) {
                var alreadyAdded = String(song.id) in (book.songs || {});
                return React.createElement("div", { className: "song-item", key: song.id },
                  React.createElement("span", { className: "book-song-title" }, song.title),
                  React.createElement("button", {
                    type: "button",
                    className: alreadyAdded ? "btn-icon btn-added" : "btn-icon btn-add",
                    disabled: alreadyAdded,
                    onClick: alreadyAdded ? null : function() { self.handleAddSong(song); },
                    title: alreadyAdded ? "Already added" : "Add to book"
                  }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" },
                    React.createElement("line", { x1: "7", y1: "2", x2: "7", y2: "12" }),
                    React.createElement("line", { x1: "2", y1: "7", x2: "12", y2: "7" })
                  ))
                );
              }, this)
            )
          ),
          React.createElement("div", { className: "book-songs-container" },
            React.createElement("div", { className: "songs-header" },
              React.createElement("h3", null, "Book Songs"),
              React.createElement("span", { className: "song-count" }, bookSongCount + " songs")
            ),
            bookSongCount === 0 ? React.createElement("div", { className: "songs-empty" }, "Add songs from the left panel") :
            React.createElement("div", { className: "book-songs" },
              bookSongs.map(function(songData, arrayIndex) {
                var song = songData.song;
                var bookIndex = songData.index;
                var isDragOver = self.state.dragOverIndex === arrayIndex;
                var isDragging = self.state.dragIndex === arrayIndex;

                return React.createElement("div", {
                  className: "song-item" + (isDragOver ? " drag-over" : "") + (isDragging ? " dragging" : ""),
                  key: song.id,
                  draggable: true,
                  onDragStart: function(e) { self.handleDragStart(e, arrayIndex); },
                  onDragEnd: function(e) { self.handleDragEnd(e); },
                  onDragOver: function(e) { self.handleDragOver(e, arrayIndex); },
                  onDrop: function(e) { self.handleDrop(e, arrayIndex); },
                  onTouchStart: function(e) { self.handleTouchStart(e, arrayIndex); },
                  onTouchMove: function(e) { self.handleTouchMove(e, arrayIndex); },
                  onTouchEnd: function(e) { self.handleTouchEnd(e); }
                },
                  React.createElement("span", { className: "drag-handle", title: "Drag to reorder" },
                    React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor" },
                      React.createElement("circle", { cx: "5.5", cy: "3", r: "1.5" }),
                      React.createElement("circle", { cx: "10.5", cy: "3", r: "1.5" }),
                      React.createElement("circle", { cx: "5.5", cy: "8", r: "1.5" }),
                      React.createElement("circle", { cx: "10.5", cy: "8", r: "1.5" }),
                      React.createElement("circle", { cx: "5.5", cy: "13", r: "1.5" }),
                      React.createElement("circle", { cx: "10.5", cy: "13", r: "1.5" })
                    )
                  ),
                  React.createElement("span", { className: "book-song-number" }, bookIndex),
                  React.createElement("span", { className: "book-song-title" }, song.title),
                  React.createElement("button", {
                    type: "button",
                    className: "btn-icon btn-remove",
                    onClick: function() { self.handleRemoveSong(bookIndex); },
                    title: "Remove from book"
                  }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" },
                    React.createElement("line", { x1: "3", y1: "3", x2: "11", y2: "11" }),
                    React.createElement("line", { x1: "11", y1: "3", x2: "3", y2: "11" })
                  ))
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
          key: "book-title-input"
        })
      ),
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
    );
  }
}
