// Book create/edit form. Two-pane builder: Find songs (left) / Your book (right),
// with a sticky Save/Cancel bar rendered by the ERB form. Song state is split
// into `searchResults` (transient API list) and `songData` ({ id -> song }) so
// book rows render without coupling them to the current search.
function indexSongs(list) {
  var map = {};
  (list || []).forEach(function(s) { map[String(s.id)] = s; });
  return map;
}

function buildLanguages(songsMap, songData) {
  var set = {};
  Object.keys(songsMap).forEach(function(id) {
    var song = songData[id];
    if (song) {
      var lang = song.lang || song.language;
      if (lang) set[lang] = true;
    }
  });
  return Object.keys(set);
}

function reorderSongObject(songObject) {
  var orderedKeys = Object.keys(songObject).sort(function(a, b) {
    return parseInt(songObject[a]) - parseInt(songObject[b]);
  });
  var result = {};
  orderedKeys.forEach(function(id, index) { result[id] = String(index + 1); });
  return result;
}

class AdminBookForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search: "",
      searchResults: [],          // latest results from the API (Find songs list)
      songData: indexSongs(props.seededSongs || []),  // { id -> song } for rendering book rows
      book: {
        name: props.book.name || "",
        email: props.book.email || "",
        songs: props.book.songs || {},
        languages: props.book.languages || [],
      },
      loading: false,
      dragIndex: null,            // index of the row being dragged
      dragOverIndex: null,        // index where the dragged row will drop
      importModalOpen: false,
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.searchSongs = this.searchSongs.bind(this);
    this.handleAddSong = this.handleAddSong.bind(this);
    this.handleRemoveSong = this.handleRemoveSong.bind(this);
    this.handleBookTitle = this.handleBookTitle.bind(this);
    this.handleBookEmail = this.handleBookEmail.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleDropAt = this.handleDropAt.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.openImport = this.openImport.bind(this);
    this.closeImport = this.closeImport.bind(this);
    this.addSongsFromImport = this.addSongsFromImport.bind(this);
    this.clearAllSongs = this.clearAllSongs.bind(this);

    this.searchTimeout = null;
    this.bookListEl = null;       // callback ref to the .book-songs container

    this.searchSongs("");
  }

  componentWillUnmount() {
    // Clean up any in-flight touch-drag listeners if the form unmounts mid-drag.
    if (this.bookListEl) {
      this.bookListEl.removeEventListener("touchmove", this.onTouchMove);
      this.bookListEl.removeEventListener("touchend", this.onTouchEnd);
      this.bookListEl.removeEventListener("touchcancel", this.onTouchEnd);
    }
  }

  // --- title / email ---

  handleBookTitle(e) {
    var name = e.target.value;
    this.setState((prev) => ({ book: Object.assign({}, prev.book, { name }) }));
  }

  handleBookEmail(e) {
    var email = e.target.value;
    this.setState((prev) => ({ book: Object.assign({}, prev.book, { email }) }));
  }

  // --- search ---

  handleSearchChange(e) {
    var search = e.target.value;
    this.setState({ search });
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.searchSongs(search), 300);
  }

  clearSearch() {
    this.setState({ search: "" });
    var input = document.getElementById("index_search");
    if (input) input.focus();
  }

  searchSongs(search) {
    this.setState({ loading: true });
    var csrfToken = document.querySelector("meta[name='csrf-token']").content;
    fetch("/api/v2/custom_book_search?search=" + encodeURIComponent(search), {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
    })
      .then((r) => r.json())
      .then((data) => {
        var results = data.songs || [];
        this.setState((prev) => {
          var songData = Object.assign({}, prev.songData, indexSongs(results));
          return { searchResults: results, songData, loading: false };
        });
      })
      .catch((error) => {
        console.error("Error:", error);
        this.setState({ loading: false });
      });
  }

  // --- add / remove ---

  handleAddSong(song) {
    this.setState((prev) => {
      var key = String(song.id);
      var songs = Object.assign({}, prev.book.songs);
      if (songs[key]) return null;
      songs[key] = String(Object.keys(songs).length + 1);
      var songData = Object.assign({}, prev.songData);
      songData[key] = song;
      var languages = buildLanguages(songs, songData);
      return { book: Object.assign({}, prev.book, { songs, languages }), songData };
    });
  }

  handleRemoveSong(index) {
    this.setState((prev) => {
      var songs = Object.assign({}, prev.book.songs);
      var id = Object.keys(songs).find((k) => songs[k] === index);
      if (id === undefined) return null;
      delete songs[id];
      var reordered = reorderSongObject(songs);
      var languages = buildLanguages(reordered, prev.songData);
      return { book: Object.assign({}, prev.book, { songs: reordered, languages }) };
    });
  }

  getOrderedBookSongs() {
    var songData = this.state.songData;
    return Object.entries(this.state.book.songs || {})
      .sort((a, b) => parseInt(a[1]) - parseInt(b[1]))
      .map((entry) => {
        var song = songData[entry[0]];
        return song ? { song, index: entry[1] } : null;
      })
      .filter(Boolean);
  }

  // --- drag reorder (desktop HTML5 + scoped touch) ---

  handleDragStart(e, index) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    this.setState({ dragIndex: index });
  }

  handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (this.state.dragOverIndex !== index) this.setState({ dragOverIndex: index });
  }

  handleDrop(e, dropIndex) {
    e.preventDefault();
    var dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    this.handleDropAt(dragIndex, dropIndex);
    this.setState({ dragIndex: null, dragOverIndex: null });
  }

  handleDragEnd() {
    this.setState({ dragIndex: null, dragOverIndex: null });
  }

  handleDropAt(fromIndex, toIndex) {
    if (fromIndex === undefined || toIndex === undefined || fromIndex === toIndex) return;
    this.setState((prev) => {
      var entries = Object.entries(prev.book.songs).sort((a, b) => parseInt(a[1]) - parseInt(b[1]));
      var dragged = entries.splice(fromIndex, 1);
      entries.splice(toIndex, 0, dragged[0]);
      var reordered = {};
      entries.forEach((entry, i) => { reordered[entry[0]] = String(i + 1); });
      return { book: Object.assign({}, prev.book, { songs: reordered }) };
    });
  }

  // Touch: begin only after a 10px move on a drag handle; attach non-passive
  // listeners to the list container so preventDefault stops scrolling reliably.
  handleTouchStart(e, index) {
    if (!e.target.closest(".drag-handle")) return;
    this._touchDragIndex = index;
    this._touchStartY = e.touches[0].clientY;
    this._touchStarted = false;
    if (this.bookListEl) {
      this.bookListEl.addEventListener("touchmove", this.onTouchMove, { passive: false });
      this.bookListEl.addEventListener("touchend", this.onTouchEnd);
      this.bookListEl.addEventListener("touchcancel", this.onTouchEnd);
    }
  }

  onTouchMove(e) {
    if (this._touchDragIndex === undefined || !this.bookListEl) return;
    var touch = e.touches[0];
    var deltaY = Math.abs(touch.clientY - this._touchStartY);
    if (!this._touchStarted && deltaY < 10) return;
    if (!this._touchStarted) {
      this._touchStarted = true;
      this.setState({ dragIndex: this._touchDragIndex });
    }
    e.preventDefault(); // listener is non-passive, so this works
    var items = this.bookListEl.querySelectorAll(".song-item");
    var newIndex = items.length - 1;
    for (var i = 0; i < items.length; i++) {
      var rect = items[i].getBoundingClientRect();
      if (touch.clientY < rect.top + rect.height / 2) { newIndex = i; break; }
    }
    if (newIndex !== this.state.dragOverIndex) this.setState({ dragOverIndex: newIndex });
  }

  onTouchEnd() {
    if (this.bookListEl) {
      this.bookListEl.removeEventListener("touchmove", this.onTouchMove);
      this.bookListEl.removeEventListener("touchend", this.onTouchEnd);
      this.bookListEl.removeEventListener("touchcancel", this.onTouchEnd);
    }
    if (this._touchStarted) {
      this.handleDropAt(this._touchDragIndex, this.state.dragOverIndex);
    }
    this._touchDragIndex = undefined;
    this._touchStartY = undefined;
    this._touchStarted = false;
    this.setState({ dragIndex: null, dragOverIndex: null });
  }

  // --- import modal ---

  openImport() {
    this.setState({ importModalOpen: true });
  }

  closeImport() {
    this.setState({ importModalOpen: false });
  }

  // Merge songs ([{id, title, lang}, ...]) from the import modal into the book
  // in a single setState pass so language recomputation sees the new song data.
  addSongsFromImport(songs) {
    this.setState((prev) => {
      var songData = Object.assign({}, prev.songData);
      songs.forEach((s) => { songData[String(s.id)] = s; });
      var bookSongs = Object.assign({}, prev.book.songs);
      songs.forEach((s) => {
        var key = String(s.id);
        if (!bookSongs[key]) bookSongs[key] = String(Object.keys(bookSongs).length + 1);
      });
      var languages = buildLanguages(bookSongs, songData);
      return { songData, book: Object.assign({}, prev.book, { songs: bookSongs, languages }) };
    });
  }

  // New books only: empty the song list (title/email are kept).
  clearAllSongs() {
    if (!window.confirm("Remove all songs from this book?")) return;
    this.setState((prev) => ({
      book: Object.assign({}, prev.book, { songs: {}, languages: [] })
    }));
  }

  // --- render ---

  renderTitleAndEmail(book) {
    // The contact email is only collected when creating a book (it's where the
    // share-links email is sent). It's hidden when editing.
    return (
      <div className="book-header">
        <input
          id="book_title"
          autoComplete="off"
          value={book.name}
          onChange={this.handleBookTitle}
          name="book[name]"
          className="book-form-title"
          placeholder="Book title"
          aria-label="Book title"
        />
        {!this.props.isPersisted && (
          <input
            id="book_email"
            autoComplete="off"
            type="email"
            value={book.email || ""}
            onChange={this.handleBookEmail}
            name="book[email]"
            className="book-form-title book-form-email"
            placeholder="Contact email (optional)"
            aria-label="Contact email (optional)"
          />
        )}
      </div>
    );
  }

  // Book-level actions that sit ABOVE the two panes (not inside Find songs):
  // Import songs (opens the modal) and, for a new book with songs, Clear all.
  renderBookActions(bookSongCount) {
    var canClear = !this.props.isPersisted && bookSongCount > 0;
    return (
      <div className="book-actions">
        <button type="button" className="action-btn primary" onClick={this.openImport}>Import songs</button>
        {canClear && <button type="button" className="action-btn danger" onClick={this.clearAllSongs}>Clear all</button>}
      </div>
    );
  }

  render() {
    var search = this.state.search;
    var book = this.state.book;
    var loading = this.state.loading;
    var results = this.state.searchResults;
    var bookSongs = this.getOrderedBookSongs();
    var bookSongCount = Object.keys(book.songs || {}).length;

    var addIcon = (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="7" y1="2" x2="7" y2="12" />
        <line x1="2" y1="7" x2="12" y2="7" />
      </svg>
    );
    var removeIcon = (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="3" x2="11" y2="11" />
        <line x1="11" y1="3" x2="3" y2="11" />
      </svg>
    );
    var gripIcon = (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <circle cx="5.5" cy="3" r="1.5" />
        <circle cx="10.5" cy="3" r="1.5" />
        <circle cx="5.5" cy="8" r="1.5" />
        <circle cx="10.5" cy="8" r="1.5" />
        <circle cx="5.5" cy="13" r="1.5" />
        <circle cx="10.5" cy="13" r="1.5" />
      </svg>
    );

    return (
      <div className="admin-book-form">
        {this.renderTitleAndEmail(book)}
        {this.renderBookActions(bookSongCount)}

        <div className="book-builder">
          {/* --- Find songs pane --- */}
          <div className="pane find-pane">
            <div className="pane-header">
              <h3>Find songs</h3>
              <div className="search-row">
                <input
                  id="index_search"
                  autoComplete="off"
                  value={search}
                  onChange={this.handleSearchChange}
                  name="search"
                  className="index_search"
                  placeholder="Search songs…"
                  aria-label="Search songs"
                />
                {search.length > 0 && (
                  <button type="button" className="clear-search-btn" onClick={this.clearSearch} aria-label="Clear search">×</button>
                )}
              </div>
            </div>
            <div className="find-results songs">
              {loading ? (
                <div className="songs-empty">Loading…</div>
              ) : results.length === 0 ? (
                <div className="songs-empty">{search.length > 0 ? "No songs found" : "Type to search"}</div>
              ) : (
                results.map((song) => {
                  var alreadyAdded = String(song.id) in (book.songs || {});
                  return (
                    <div className="song-item" key={song.id}>
                      <span className="song-title">{song.title}</span>
                      <button
                        type="button"
                        className={alreadyAdded ? "btn-icon btn-added" : "btn-icon btn-add"}
                        disabled={alreadyAdded}
                        onClick={alreadyAdded ? null : () => this.handleAddSong(song)}
                        title={alreadyAdded ? "Already added" : "Add to book"}
                        aria-label={alreadyAdded ? "Already added" : "Add " + song.title}
                      >{addIcon}</button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* --- Your book pane --- */}
          <div className="pane book-pane">
            <div className="pane-header">
              <h3>Your book</h3>
              <span className="song-count">{bookSongCount + (bookSongCount === 1 ? " song" : " songs")}</span>
            </div>
            {bookSongCount === 0 ? (
              <div className="songs-empty book-empty">Songs you add or import will appear here.</div>
            ) : (
              <div className="book-songs" ref={(el) => { this.bookListEl = el; }}>
                {bookSongs.map((songData, arrayIndex) => {
                  var song = songData.song;
                  var bookIndex = songData.index;
                  var isDragging = this.state.dragIndex === arrayIndex;
                  var isDragOver = this.state.dragOverIndex === arrayIndex;
                  return (
                    <div
                      className={"song-item" + (isDragging ? " dragging" : "") + (isDragOver ? " drag-over" : "")}
                      key={song.id}
                      draggable={true}
                      onDragStart={(e) => this.handleDragStart(e, arrayIndex)}
                      onDragOver={(e) => this.handleDragOver(e, arrayIndex)}
                      onDrop={(e) => this.handleDrop(e, arrayIndex)}
                      onDragEnd={this.handleDragEnd}
                      onTouchStart={(e) => this.handleTouchStart(e, arrayIndex)}
                    >
                      <span className="drag-handle" title="Drag to reorder" aria-label="Drag to reorder">{gripIcon}</span>
                      <span className="book-song-number">{bookIndex}</span>
                      <span className="song-title">{song.title}</span>
                      <button
                        type="button"
                        className="btn-icon btn-remove"
                        onClick={() => this.handleRemoveSong(bookIndex)}
                        title="Remove from book"
                        aria-label={"Remove " + song.title}
                      >{removeIcon}</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <input type="hidden" name="book[songs]" value={JSON.stringify(book.songs || {})} />
        <input type="hidden" name="book[languages]" value={JSON.stringify(book.languages || [])} />
        {/* Email is hidden when editing (not editable), but re-submitted so the stored value is preserved on save. */}
        {this.props.isPersisted && <input type="hidden" name="book[email]" value={book.email || ""} />}

        {this.state.importModalOpen && (
          <BookImportModal
            duplicatableBooks={this.props.duplicatableBooks}
            onAddSongs={this.addSongsFromImport}
            onClose={this.closeImport}
          />
        )}
      </div>
    );
  }
}
