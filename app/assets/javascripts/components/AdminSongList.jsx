class AdminSongList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { songs: {}, loading: true, error: null, search: "" };
    this.handleChange = this.handleChange.bind(this);
    this.updateSongList = this.updateSongList.bind(this);
  }

  componentDidMount() {
    // Restore the search term if the user navigated back from editing a song.
    let search = (window.history.state && window.history.state.search) || "";
    this.setState({ search });
    this.updateSongList(search);
  }

  handleChange(event) {
    let search = event.target.value;
    // Persist the search across navigation (back out of a song edit).
    window.history.replaceState({ search }, "");
    this.setState({ search });
    this.updateSongList(search);
  }

  updateSongList(search) {
    this.setState({ loading: true, error: null });
    let csrfToken = document.querySelector("meta[name=csrf-token]").content;
    let params = new URLSearchParams({ search });

    fetch("/api/v2/admin_songs?" + params.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load songs");
        return response.json();
      })
      .then((data) => this.setState({ songs: data.songs || {}, loading: false }))
      .catch((error) => { console.error("Error:", error); this.setState({ loading: false, error: "Couldn't load songs." }); });
  }

  // Bucket order: duplicates (super-admin, no search) → recently changed → unchanged.
  orderedSongs() {
    let songs = this.state.songs || {};
    return ["duplicates", "changed", "unchanged"].reduce((acc, type) => acc.concat(songs[type] || []), []);
  }

  render() {
    let editClassNames = {
      duplicates: "requires-review-duplicate",
      changed: "requires-review-changed",
      unchanged: ""
    };
    let { loading, error, search } = this.state;
    let rows = this.orderedSongs();
    let bucketOf = (song) => {
      let found = "unchanged";
      ["duplicates", "changed"].forEach((t) => { if ((this.state.songs[t] || []).some((s) => s.id === song.id)) found = t; });
      return found;
    };
    let isEmpty = !loading && !error && rows.length === 0;

    return (
      <div className="admin_list" aria-busy={loading}>
        <div className="admin-search-bar">
          <input
            id="admin_search"
            className="admin-search"
            value={search}
            onChange={this.handleChange}
            placeholder="Search songs…"
            aria-label="Search songs"
          />
          <a className="new_song_link" href="/songs/new">New Song</a>
        </div>

        {error && <div className="admin-songs-empty">{error}</div>}
        {loading && <div className="admin-songs-empty">Loading…</div>}
        {isEmpty && <div className="admin-songs-empty">No songs found.</div>}

        {!loading && !error && rows.length > 0 && (
          <table className="admin_table">
            <tbody aria-live="polite">
              {rows.map((song) => (
                <tr key={song.id}>
                  <td>
                    <a className={"edit_song_link " + editClassNames[bucketOf(song)]} href={"/songs/" + song.id + "/edit"}>
                      {song.title}
                    </a>
                  </td>
                  <td><span className="analytics-lang">{song.lang}</span></td>
                  <td><div className="last_edited" title={song.last_editor}>{song.last_editor}</div></td>
                  <td><div className="edit_timestamp">{song.edit_timestamp}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }
}
