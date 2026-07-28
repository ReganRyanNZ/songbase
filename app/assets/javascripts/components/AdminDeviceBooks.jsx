class AdminDeviceBooks extends React.Component {
  constructor(props) {
    super(props);
    this.state = { books: [], loading: true, error: null };
  }

  componentDidMount() {
    this.loadBooks();
  }

  // Open the same IndexedDB the main app uses and read the books store.
  // This shows what's cached on *this device* — not the server's full
  // catalogue. The schema declarations must match DatabaseSetupAndSync's
  // defineSchema() so Dexie recognises the existing database.
  //
  // Uses .then() chains rather than async/await because Sprockets'
  // JSX transformer downlevels async functions to a regenerator-based
  // helper (regeneratorRuntime) that isn't loaded — that throws inside
  // componentDidMount and React unmounts the whole component.
  loadBooks() {
    this.setState({ loading: true, error: null });
    try {
      let db = new Dexie("songbaseDB");
      db.version(6).stores({
        settings: "settingsType",
        songs: "id, title, lang",
        books: "id, slug, *languages",
        references: null,
        analytics: "song_id"
      });
      db.version(7).stores({
        recently_viewed: "song_id, viewed_at"
      });

      db.books.toArray()
        .then((books) => {
          books.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          this.setState({ books: books, loading: false });
          db.close();
        })
        .catch((error) => {
          console.error("Error reading books from device:", error);
          this.setState({ loading: false, error: "Couldn't read books from this device." });
        });
    } catch (error) {
      console.error("Error reading books from device:", error);
      this.setState({ loading: false, error: "Couldn't read books from this device." });
    }
  }

  render() {
    let { loading, error, books } = this.state;

    return (
      <div className="admin-device-books" aria-busy={loading}>
        <h2 className="admin-section-title">Books on this device ({books.length})</h2>
        {error && <div className="admin-songs-empty">{error}</div>}
        {loading && <div className="admin-songs-empty">Loading…</div>}
        {!loading && !error && books.length === 0 && (
          <div className="admin-songs-empty">No books cached on this device. Open the app on this device to sync.</div>
        )}
        {!loading && !error && books.length > 0 && (
          <table className="admin_table">
            <tbody aria-live="polite">
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.name}</td>
                  <td><span className="analytics-lang">{(book.languages || []).join(", ")}</span></td>
                  <td className="device-book-count">{Object.keys(book.songs || {}).length} songs</td>
                  <td className="device-book-type">{book.sync_to_all ? "Public" : "Custom"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }
}
