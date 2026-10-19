// Add-songs modal: a focused, centered overlay. Contains Search and Paste as
// tabs *inside* the overlay. In the two-pane book form the search lives in the
// left pane, so the overlay is opened on the Paste tab (initialTab="paste");
// it can still be flipped to Search.
//
// Calls back into AdminBookForm via onAddSong(song, tuneIndex) and
// onAddSongs(songsArray). Adds default to tune 0; multi-tune songs get a tune
// chip in the book list to adjust later.

class AddSongs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: props.initialTab || "search", // "search" | "paste"
      search: "",
      searchResults: [],
      loading: false,
      // paste
      pasteText: "",
      pasteLoading: false,
      pastePreview: null,       // { matched, unmatched, ambiguous, truncated } | { error }
      pasteChecked: {},
      pasteAmbiguousPick: {},
      addedCount: 0,            // running tally while the palette is open
    };

    this.handleEsc = this.handleEsc.bind(this);
    this.setTab = this.setTab.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.runSearch = this.runSearch.bind(this);
    this.handleSearchKey = this.handleSearchKey.bind(this);
    this.add = this.add.bind(this);
    this.runPreview = this.runPreview.bind(this);
    this.togglePasteChecked = this.togglePasteChecked.bind(this);
    this.pickAmbiguous = this.pickAmbiguous.bind(this);
    this.pasteSelectedSongs = this.pasteSelectedSongs.bind(this);
    this.addFromPaste = this.addFromPaste.bind(this);

    this.searchTimeout = null;
    this.searchAbort = null;
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleEsc);
    this.runSearch("");
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleEsc);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (this.searchAbort) this.searchAbort.abort();
  }

  handleEsc(e) {
    if (e.key === "Escape") this.props.onClose();
  }

  setTab(tab) {
    this.setState({ tab: tab });
  }

  // --- search ---

  handleSearchChange(e) {
    var search = e.target.value;
    this.setState({ search: search });
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.runSearch(search), 300);
  }

  clearSearch() {
    if (this.searchTimeout) { clearTimeout(this.searchTimeout); this.searchTimeout = null; }
    this.setState({ search: "" });
    this.runSearch("");
  }

  runSearch(search) {
    if (this.searchAbort) { this.searchAbort.abort(); }
    var abort = new AbortController();
    this.searchAbort = abort;

    this.setState({ loading: true });
    var csrfToken = document.querySelector("meta[name='csrf-token']").content;
    fetch("/api/v2/custom_book_search?search=" + encodeURIComponent(search), {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      signal: abort.signal
    })
      .then((r) => r.json())
      .then((data) => {
        this.setState({ searchResults: data.songs || [], loading: false });
      })
      .catch((error) => {
        if (error && error.name === "AbortError") return;
        console.error("Error:", error);
        this.setState({ loading: false });
      });
  }

  handleSearchKey(e) {
    if (e.key !== "Enter") return;
    var first = this.state.searchResults && this.state.searchResults[0];
    if (!first) return;
    if (String(first.id) in (this.props.bookSongs || {})) return;
    e.preventDefault();
    this.add(first);
  }

  add(song) {
    this.props.onAddSong(song, 0);
    this.setState((prev) => ({ addedCount: prev.addedCount + 1 }));
  }

  // --- paste ---

  runPreview() {
    if (!this.state.pasteText.trim()) return;
    this.setState({ pasteLoading: true });
    fetch("/api/v2/custom_book_import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "auto", text: this.state.pasteText })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          this.setState({ pasteLoading: false, pastePreview: { error: data.error } });
          return;
        }
        var checked = {};
        (data.matched || []).forEach((s) => { checked[s.id] = true; });
        this.setState({
          pasteLoading: false,
          pastePreview: {
            matched: data.matched || [],
            unmatched: data.unmatched || [],
            ambiguous: data.ambiguous || [],
            truncated: data.truncated
          },
          pasteChecked: checked,
          pasteAmbiguousPick: {}
        });
      })
      .catch(() => this.setState({ pasteLoading: false, pastePreview: { error: "Preview failed. Please try again." } }));
  }

  togglePasteChecked(id) {
    this.setState((prev) => {
      var next = Object.assign({}, prev.pasteChecked);
      if (next[id]) delete next[id]; else next[id] = true;
      return { pasteChecked: next };
    });
  }

  pickAmbiguous(lineIndex, songId) {
    this.setState((prev) => {
      var next = Object.assign({}, prev.pasteAmbiguousPick);
      if (songId) next[lineIndex] = songId; else delete next[lineIndex];
      return { pasteAmbiguousPick: next };
    });
  }

  pasteSelectedSongs() {
    var p = this.state.pastePreview;
    if (!p || p.error) return [];
    var songs = [];
    (p.matched || []).forEach((s) => {
      if (this.state.pasteChecked[s.id]) songs.push(s);
    });
    (p.ambiguous || []).forEach((item, i) => {
      var pickId = this.state.pasteAmbiguousPick[i];
      if (pickId) {
        var song = item.matches.find((m) => String(m.id) === String(pickId));
        if (song) songs.push(song);
      }
    });
    return songs;
  }

  addFromPaste() {
    var songs = this.pasteSelectedSongs();
    if (!songs.length) return;
    this.props.onAddSongs(songs);
    this.setState((prev) => ({
      addedCount: prev.addedCount + songs.length,
      pasteText: "",
      pastePreview: null,
      pasteChecked: {},
      pasteAmbiguousPick: {}
    }));
  }

  // --- render ---

  renderSearch() {
    var results = this.state.searchResults;
    var bookSongs = this.props.bookSongs || {};
    var addIcon = (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="7" y1="2" x2="7" y2="12" />
        <line x1="2" y1="7" x2="12" y2="7" />
      </svg>
    );
    var tickIcon = (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2,7 6,11 12,3" />
      </svg>
    );

    return (
      <div className="asm-search">
        <div className="search-row">
          <input
            className="index_search"
            autoComplete="off"
            value={this.state.search}
            onChange={this.handleSearchChange}
            onKeyDown={this.handleSearchKey}
            placeholder="Search songs…"
            aria-label="Search songs"
            autoFocus
          />
          {this.state.search.length > 0 && (
            <button type="button" className="clear-search-btn" onClick={this.clearSearch} aria-label="Clear search">×</button>
          )}
        </div>
        <div className="asm-results">
          {this.state.loading ? (
            <div className="songs-empty">Loading…</div>
          ) : results.length === 0 ? (
            <div className="songs-empty">{this.state.search.length > 0 ? "No songs found" : "Type to search"}</div>
          ) : (
            results.map((song) => {
              var alreadyAdded = String(song.id) in bookSongs;
              return (
                <div className="song-item search-result" key={song.id}>
                  <span className="song-title">{song.title}</span>
                  {alreadyAdded ? (
                    <span className="btn-icon btn-added" title="Already added">{tickIcon}</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-icon btn-add"
                      onClick={() => this.add(song)}
                      title="Add to book"
                      aria-label={"Add " + song.title}
                    >{addIcon}</button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  renderPaste() {
    var p = this.state.pastePreview;
    var selectedCount = this.pasteSelectedSongs().length;
    return (
      <div className="asm-paste">
        <p className="tab-hint">Paste song titles or IDs, one per line. Numbers are treated as IDs; everything else as a title.</p>
        <textarea
          className="paste-textarea"
          value={this.state.pasteText}
          onChange={(e) => this.setState({ pasteText: e.target.value })}
          placeholder={"Amazing Grace\nHow Great Thou Art\n123\n..."}
          rows={6}
        />
        <div className="paste-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={this.state.pasteLoading || !this.state.pasteText.trim()}
            onClick={this.runPreview}
          >{this.state.pasteLoading ? "Checking…" : "Preview"}</button>
        </div>

        {p && p.error && <div className="paste-error">{p.error}</div>}

        {p && !p.error && (
          <div className="paste-preview">
            {p.truncated && <div className="paste-truncated">Only the first 300 unique lines were processed.</div>}

            {p.matched.length > 0 && (
              <div className="preview-group">
                <div className="preview-subhead">{"Matches (" + p.matched.length + ")"}</div>
                {p.matched.map((s) => {
                  var checked = !!this.state.pasteChecked[s.id];
                  return (
                    <label className={"preview-row matched" + (checked ? "" : " unchecked")} key={s.id}>
                      <input type="checkbox" checked={checked} onChange={() => this.togglePasteChecked(s.id)} />
                      <span className="preview-status ok">✓</span>
                      <span className="preview-title">{s.title}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {p.ambiguous.length > 0 && (
              <div className="preview-group">
                <div className="preview-subhead">{"Ambiguous — pick one for each (" + p.ambiguous.length + ")"}</div>
                {p.ambiguous.map((item, i) => (
                  <div className="preview-row ambiguous" key={"amb-" + i}>
                    <span className="preview-status">?</span>
                    <div className="ambiguous-pick">
                      <div className="ambiguous-line">{"“" + item.line + "”"}</div>
                      <select
                        className="ambiguous-select"
                        value={this.state.pasteAmbiguousPick[i] || ""}
                        onChange={(e) => this.pickAmbiguous(i, e.target.value)}
                      >
                        <option value="">— skip —</option>
                        {item.matches.map((m) => <option key={m.id} value={m.id}>{m.title + " (" + (m.lang || "?") + ")"}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {p.unmatched.length > 0 && (
              <div className="preview-group">
                <div className="preview-subhead">{"Not found (" + p.unmatched.length + ")"}</div>
                {p.unmatched.map((line, i) => (
                  <div className="preview-row unmatched" key={"no-" + i}>
                    <span className="preview-status">✗</span>
                    <span className="preview-title muted">{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedCount > 0 && (
          <button type="button" className="btn btn-primary add-bulk-btn" onClick={this.addFromPaste}>
            {"Add " + selectedCount + " " + (selectedCount === 1 ? "song" : "songs")}
          </button>
        )}
      </div>
    );
  }

  render() {
    var isSearch = this.state.tab === "search";
    var doneLabel = this.state.addedCount > 0 ? ("Done (" + this.state.addedCount + " added)") : "Done";

    return (
      <div className="add-songs-overlay" onClick={this.props.onClose}>
        <div className="add-songs-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add songs">
          <div className="asm-header">
            <h2>Add songs</h2>
            <button type="button" className="asm-close" onClick={this.props.onClose} aria-label="Close">×</button>
          </div>

          <div className="asm-tabs">
            <button type="button" className={"asm-tab" + (isSearch ? " active" : "")} onClick={() => this.setTab("search")}>Search</button>
            <button type="button" className={"asm-tab" + (!isSearch ? " active" : "")} onClick={() => this.setTab("paste")}>Paste</button>
          </div>

          <div className="asm-body">
            {isSearch ? this.renderSearch() : this.renderPaste()}
          </div>

          <div className="asm-footer">
            <button type="button" className="btn btn-primary asm-done" onClick={this.props.onClose}>{doneLabel}</button>
          </div>
        </div>
      </div>
    );
  }
}
