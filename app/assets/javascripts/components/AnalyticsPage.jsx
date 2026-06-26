class AnalyticsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { songs: [], loading: true, error: null, range: "all", language: "" };
    this.setRange = this.setRange.bind(this);
    this.setLanguage = this.setLanguage.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.range !== this.state.range || prevState.language !== this.state.language) {
      this.fetchData();
    }
  }

  fetchData() {
    this.setState({ loading: true, error: null });
    let csrfToken = document.querySelector("meta[name=csrf-token]").content;
    let params = new URLSearchParams();
    if (this.state.range !== "all") params.set("range", this.state.range);
    if (this.state.language) params.set("language", this.state.language);

    fetch("/api/v2/analytics" + (params.toString() ? "?" + params.toString() : ""), {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
    })
      .then((response) => { if (!response.ok) throw new Error("Failed to load analytics"); return response.json(); })
      .then((data) => this.setState({ songs: data.songs || [], loading: false }))
      .catch((error) => { this.setState({ loading: false, error: error.message }); });
  }

  setRange(range) { this.setState({ range }); }
  setLanguage(e) { this.setState({ language: e.target.value }); }

  csvUrl() {
    let params = new URLSearchParams();
    if (this.state.range !== "all") params.set("range", this.state.range);
    if (this.state.language) params.set("language", this.state.language);
    return "/api/v2/analytics.csv" + (params.toString() ? "?" + params.toString() : "");
  }

  render() {
    let { songs, loading, error, range, language } = this.state;
    let languages = this.props.languages || [];

    return (
      <div className="analytics-page">
        <div className="analytics-filters">
          <div className="analytics-range-toggle">
            {[["all", "All time"], ["30d", "30 days"], ["7d", "7 days"]].map(([key, label]) => (
              <button key={key} type="button"
                className={"analytics-range-btn" + (range === key ? " active" : "")}
                onClick={() => this.setRange(key)}>{label}</button>
            ))}
          </div>
          {languages.length > 0 && (
            <select className="analytics-lang-select" value={language} onChange={this.setLanguage} aria-label="Filter by language">
              <option value="">All languages</option>
              {languages.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          )}
          <a className="analytics-csv-btn" href={this.csvUrl()}>Export CSV</a>
        </div>

        <p className="analytics-subtitle">{songs.length} songs tracked, sorted by total views</p>

        {loading && <div className="analytics-loading">Loading…</div>}
        {error && <div className="analytics-error">{error}</div>}
        {!loading && !error && songs.length === 0 && <div className="analytics-empty">No analytics data yet.</div>}
        {!loading && !error && songs.map((song, index) => (
          <div className="analytics-row" key={song.id}>
            <span className="analytics-rank">{index + 1}</span>
            <span className="analytics-title"><a href={"/" + song.id}>{song.title}</a></span>
            <span className="analytics-lang">{song.lang}</span>
            <span className="analytics-count">{song.total_count}</span>
          </div>
        ))}
      </div>
    );
  }
}
