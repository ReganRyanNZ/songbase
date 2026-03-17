class AnalyticsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { songs: [], loading: true, error: null };
  }

  componentDidMount() {
    const csrfToken = document.querySelector("meta[name=csrf-token]").content;
    fetch("/api/v2/analytics", {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
    })
      .then(response => {
        if (!response.ok) { throw new Error("Failed to load analytics"); }
        return response.json();
      })
      .then(data => this.setState({ songs: data.songs, loading: false }))
      .catch(error => this.setState({ error: error.message, loading: false }));
  }

  render() {
    const { songs, loading, error } = this.state;

    if (loading) { return <div className="analytics-loading">Loading analytics...</div>; }
    if (error)   { return <div className="analytics-error">{error}</div>; }
    if (songs.length === 0) {
      return <div className="analytics-empty">No analytics data yet. Songs are recorded after 30 seconds of viewing.</div>;
    }

    return (
      <div className="analytics-page">
        <p className="analytics-subtitle">{songs.length} songs tracked, sorted by total plays</p>
        <table className="admin_table analytics-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Song</th>
              <th>Language</th>
              <th>Total Plays</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, index) => (
              <tr key={song.id}>
                <td className="analytics-rank">{index + 1}</td>
                <td>
                  <a href={`/${song.id}`} className="edit_song_link">{song.title}</a>
                </td>
                <td className="analytics-lang">{song.lang}</td>
                <td className="analytics-count">{song.total_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
