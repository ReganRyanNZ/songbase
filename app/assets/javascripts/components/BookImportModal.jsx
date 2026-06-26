// Modal for the two "add many songs" flows: From a book (pick a source book and
// select songs via select-all / ranges / checkboxes — unifies duplicate and
// book-number import) and Paste a list (auto-detect titles vs IDs, preview every
// match before adding). Calls onAddSongs(songList) with [{id, title, lang}, ...].

function parseRanges(text) {
  var nums = [];
  (text || "").split(/[,\s]+/).filter(Boolean).forEach(function(part) {
    var range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      var a = parseInt(range[1], 10), b = parseInt(range[2], 10);
      if (a > b) { var t = a; a = b; b = t; }
      for (var n = a; n <= b; n++) nums.push(n);
    } else if (/^\d+$/.test(part)) {
      nums.push(parseInt(part, 10));
    }
  });
  return nums;
}

class BookImportModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: "book",
      // from-a-book
      sourceBookId: "",
      sourceName: "",
      sourceSongs: [],     // [{ number, id, title, lang }]
      sourceLoading: false,
      selectedIds: {},     // { id: true }
      rangeText: "",
      filterText: "",
      // paste-a-list
      pasteText: "",
      pasteLoading: false,
      pastePreview: null,  // { matched, unmatched, ambiguous, truncated } | { error }
      pasteChecked: {},    // { songId: true } for matched (default all on)
      pasteAmbiguousPick: {}, // { lineIndex: songId }
      // feedback
      addedCount: null,
    };

    this.handleEsc = this.handleEsc.bind(this);
    this.setTab = this.setTab.bind(this);
    this.fetchSource = this.fetchSource.bind(this);
    this.toggleId = this.toggleId.bind(this);
    this.selectAllFiltered = this.selectAllFiltered.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.selectRanges = this.selectRanges.bind(this);
    this.addFromBook = this.addFromBook.bind(this);
    this.runPreview = this.runPreview.bind(this);
    this.togglePasteChecked = this.togglePasteChecked.bind(this);
    this.pickAmbiguous = this.pickAmbiguous.bind(this);
    this.addFromPaste = this.addFromPaste.bind(this);
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleEsc);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleEsc);
  }

  handleEsc(e) {
    if (e.key === "Escape") this.props.onClose();
  }

  setTab(tab) {
    this.setState({ tab: tab, addedCount: null });
  }

  // --- from a book ---

  fetchSource(bookId) {
    if (!bookId) {
      this.setState({ sourceBookId: "", sourceSongs: [], sourceName: "", selectedIds: {}, rangeText: "", filterText: "" });
      return;
    }
    this.setState({ sourceBookId: bookId, sourceLoading: true, sourceSongs: [], sourceName: "", selectedIds: {}, rangeText: "", filterText: "" });
    fetch("/api/v2/book_songs?book_id=" + encodeURIComponent(bookId))
      .then((r) => r.json())
      .then((data) => {
        this.setState({ sourceSongs: data.songs || [], sourceName: data.name || "", sourceLoading: false });
      })
      .catch(() => this.setState({ sourceLoading: false, sourceSongs: [] }));
  }

  filteredSongs() {
    var q = this.state.filterText.trim().toLowerCase();
    var songs = this.state.sourceSongs;
    if (!q) return songs;
    return songs.filter((s) => (s.title || "").toLowerCase().indexOf(q) !== -1);
  }

  toggleId(id) {
    this.setState((prev) => {
      var next = Object.assign({}, prev.selectedIds);
      if (next[id]) delete next[id]; else next[id] = true;
      return { selectedIds: next };
    });
  }

  selectAllFiltered() {
    this.setState((prev) => {
      var next = Object.assign({}, prev.selectedIds);
      this.filteredSongs().forEach((s) => { next[s.id] = true; });
      return { selectedIds: next };
    });
  }

  clearSelection() {
    this.setState({ selectedIds: {} });
  }

  selectRanges() {
    var nums = parseRanges(this.state.rangeText);
    if (!nums.length) return;
    var numSet = {};
    nums.forEach((n) => { numSet[n] = true; });
    this.setState((prev) => {
      var next = Object.assign({}, prev.selectedIds);
      prev.sourceSongs.forEach((s) => { if (numSet[s.number]) next[s.id] = true; });
      return { selectedIds: next };
    });
  }

  addFromBook() {
    var songs = this.state.sourceSongs
      .filter((s) => this.state.selectedIds[s.id])
      .map((s) => ({ id: s.id, title: s.title, lang: s.lang }));
    if (!songs.length) return;
    this.props.onAddSongs(songs);
    this.setState({ addedCount: songs.length, selectedIds: {}, rangeText: "" });
  }

  // --- paste a list ---

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
      if (this.state.pasteChecked[s.id]) songs.push({ id: s.id, title: s.title, lang: s.lang });
    });
    (p.ambiguous || []).forEach((item, i) => {
      var pickId = this.state.pasteAmbiguousPick[i];
      if (pickId) {
        var song = item.matches.find((m) => String(m.id) === String(pickId));
        if (song) songs.push({ id: song.id, title: song.title, lang: song.lang });
      }
    });
    return songs;
  }

  addFromPaste() {
    var songs = this.pasteSelectedSongs();
    if (!songs.length) return;
    this.props.onAddSongs(songs);
    this.setState({ addedCount: songs.length, pasteText: "", pastePreview: null, pasteChecked: {}, pasteAmbiguousPick: {} });
  }

  // --- render ---

  renderBookTab() {
    var books = this.props.duplicatableBooks || [];
    var filtered = this.filteredSongs();
    var loaded = this.state.sourceBookId && !this.state.sourceLoading;

    return (
      <div className="modal-tab-body">
        <div className="source-picker">
          <label htmlFor="import-source-book">Choose a book to copy songs from</label>
          <select id="import-source-book" value={this.state.sourceBookId} onChange={(e) => this.fetchSource(e.target.value)} aria-label="Source book">
            <option value="">— Select a book —</option>
            {books.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {loaded && (
          <div className="checklist-controls">
            <input
              className="checklist-filter"
              type="search"
              placeholder="Filter songs…"
              value={this.state.filterText}
              onChange={(e) => this.setState({ filterText: e.target.value })}
              aria-label="Filter songs"
            />
            <div className="range-select">
              <input
                className="range-input"
                placeholder="e.g. 1-50, 72"
                value={this.state.rangeText}
                onChange={(e) => this.setState({ rangeText: e.target.value })}
                aria-label="Select by number range"
              />
              <button type="button" className="btn btn-ghost" onClick={this.selectRanges}>Select</button>
            </div>
            <div className="select-buttons">
              <button type="button" className="btn btn-ghost" onClick={this.selectAllFiltered}>Select all</button>
              <button type="button" className="btn btn-ghost" onClick={this.clearSelection}>Clear</button>
            </div>
          </div>
        )}

        {this.state.sourceLoading ? (
          <div className="checklist-empty">Loading…</div>
        ) : loaded ? (
          <div className="song-checklist">
            {filtered.length === 0 ? (
              <div className="checklist-empty">No songs match that filter</div>
            ) : (
              filtered.map((s) => {
                var checked = !!this.state.selectedIds[s.id];
                return (
                  <label className={"checklist-row" + (checked ? " checked" : "")} key={s.id}>
                    <input type="checkbox" checked={checked} onChange={() => this.toggleId(s.id)} />
                    <span className="checklist-number">{s.number}</span>
                    <span className="checklist-title">{s.title}</span>
                    <span className="checklist-lang">{s.lang || ""}</span>
                  </label>
                );
              })
            )}
          </div>
        ) : (
          <div className="checklist-empty">Pick a book above to see its songs.</div>
        )}
      </div>
    );
  }

  renderPasteTab() {
    var p = this.state.pastePreview;

    return (
      <div className="modal-tab-body">
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
                      <span className="preview-lang">{s.lang || ""}</span>
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
      </div>
    );
  }

  render() {
    var isBook = this.state.tab === "book";
    var selectedCount = isBook ? Object.keys(this.state.selectedIds).length : this.pasteSelectedSongs().length;
    var canAdd = selectedCount > 0;

    return (
      <div className="import-modal-overlay" onClick={this.props.onClose}>
        <div className="import-modal" onClick={(e) => e.stopPropagation()}>
          <div className="import-modal-header">
            <h2>Add songs</h2>
            <button type="button" className="modal-close" onClick={this.props.onClose} aria-label="Close">×</button>
          </div>

          <div className="import-tabs">
            <button type="button" className={"import-tab" + (isBook ? " active" : "")} onClick={() => this.setTab("book")}>From a book</button>
            <button type="button" className={"import-tab" + (!isBook ? " active" : "")} onClick={() => this.setTab("paste")}>Paste a list</button>
          </div>

          {isBook ? this.renderBookTab() : this.renderPasteTab()}

          {this.state.addedCount !== null && (
            <div className="added-flash">{"Added " + this.state.addedCount + " song" + (this.state.addedCount === 1 ? "" : "s") + " to your book."}</div>
          )}

          <div className="import-modal-footer">
            <span className="selected-count">{selectedCount + (selectedCount === 1 ? " song" : " songs") + " selected"}</span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canAdd}
              onClick={isBook ? this.addFromBook : this.addFromPaste}
            >{"Add " + selectedCount + " " + (selectedCount === 1 ? "song" : "songs")}</button>
          </div>
        </div>
      </div>
    );
  }
}
