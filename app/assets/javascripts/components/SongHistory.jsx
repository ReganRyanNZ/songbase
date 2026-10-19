// Read-only edit history for a song, driven by the Audit log.
// Each entry shows who/when (audit.description) and the before/after diffs.
class SongHistory extends React.Component {
  formattedTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString();
  }

  fieldLabel(attr) {
    return { lyrics: "Lyrics", title: "Title", lang: "Language", language_links: "Language links" }[attr] || attr;
  }

  renderChange(attr, change) {
    var from = (change && change.from !== undefined) ? change.from : change;
    var to = (change && change.to !== undefined) ? change.to : null;
    var isLyrics = attr === "lyrics";
    return (
      <div className="history-change" key={attr}>
        <div className="history-change-field">{this.fieldLabel(attr)}</div>
        {isLyrics ? (
          <div className="history-diff">
            <pre className="history-pre">{from == null ? "" : from}</pre>
            <span className="history-arrow">→</span>
            <pre className="history-pre">{to == null ? "" : to}</pre>
          </div>
        ) : (
          <div className="history-inline">
            <span className="history-from">{String(from == null ? "" : from)}</span>
            <span className="history-arrow">→</span>
            <span className="history-to">{String(to == null ? "" : to)}</span>
          </div>
        )}
      </div>
    );
  }

  render() {
    var audits = this.props.audits || [];
    if (audits.length === 0) {
      return <div className="admin-songs-empty">No edit history recorded for this song.</div>;
    }
    return (
      <div className="song-history">
        {audits.map((a) => (
          <div className={"history-entry action-" + a.action} key={a.id}>
            <div className="history-entry-head">
              <span className="history-action">{a.description}</span>
              <span className="history-time">{this.formattedTime(a.time)}</span>
            </div>
            {a.changes && Object.keys(a.changes).length > 0 && (
              <div className="history-changes">
                {Object.keys(a.changes).map((attr) => this.renderChange(attr, a.changes[attr]))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
}
