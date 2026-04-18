class AnalyticsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { songs: [], loading: true, error: null };
  }

  componentDidMount() {
    var csrfToken = document.querySelector("meta[name=csrf-token]").content;
    fetch("/api/v2/analytics", {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
    })
      .then(function(response) {
        if (!response.ok) { throw new Error("Failed to load analytics"); }
        return response.json();
      })
      .then(function(data) { this.setState({ songs: data.songs, loading: false }); }.bind(this))
      .catch(function(error) { this.setState({ error: error.message, loading: false }); }.bind(this));
  }

  render() {
    var songs = this.state.songs;
    var loading = this.state.loading;
    var error = this.state.error;
    var e = React.createElement;

    if (loading) { return e('div', { className: 'analytics-loading' }, 'Loading analytics...'); }
    if (error)   { return e('div', { className: 'analytics-error' }, error); }
    if (songs.length === 0) {
      return e('div', { className: 'analytics-empty' }, 'No analytics data yet. Songs are recorded after 30 seconds of viewing.');
    }

    return e('div', { className: 'analytics-page' },
      e('p', { className: 'analytics-subtitle' }, songs.length + ' songs tracked, sorted by total views'),
      songs.map(function(song, index) {
        return e('div', { className: 'analytics-row', key: song.id },
          e('span', { className: 'analytics-rank' }, index + 1),
          e('span', { className: 'analytics-title' },
            e('a', { href: '/' + song.id }, song.title)
          ),
          e('span', { className: 'analytics-lang' }, song.lang),
          e('span', { className: 'analytics-count' }, song.total_count)
        );
      })
    );
  }
}
