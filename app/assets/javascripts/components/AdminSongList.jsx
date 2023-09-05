class AdminSongList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songs: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.linkClassName = this.linkClassName.bind(this);
    this.updateSongList = this.updateSongList.bind(this);
  }

  componentDidMount() {
    let historyState = window.history.state;
    let value = historyState ? historyState.search : '';
    this.updateSongList(value || '');
  }

  handleChange(event) {
    let search = event.target.value;
    // Update browser history to keep search value if the user navigates back out of a song
    window.history.replaceState({ search: search }, "");
    this.updateSongList(search);
  }

  linkClassName(reviewType) {
    if (reviewType == "duplicates") {
      return "requires-review-duplicate";
    }
    if (reviewType == "changed") {
      return "requires-review-changed";
    }
    return "";
  }

  updateSongList(search) {
    let app = this;

    axios({
      method: "GET",
      url: "/api/v2/admin_songs",
      params: { search: search },
      headers: { "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content }
    }).then(function(response) {
        console.log("Admin fetch completed.");
        app.setState({songs: response.data.songs});
      });
  }

  render() {
    let editClassNames = {"duplicates": "requires-review-duplicate",
                          "changed": "requires-review-changed",
                          "unchanged": ""}
    let reviewTypes = Object.keys(this.state.songs);
    let list = reviewTypes.map((reviewType) => {
      return [].concat.apply([],
        this.state.songs[reviewType].map((song) => {
            let editClass = "edit_song_link " + editClassNames[reviewType];
            let editRef = "/songs/" + song.id + "/edit";
            let removeLink = "";

            return (
              <tr key={song.id}>
                <td>
                  <a className={editClass} href={editRef}>
                    {song.title}
                  </a>
                </td>
                <td>{removeLink}</td>
                <td>
                  <div className="last_edited">{song.last_editor}</div>
                </td>
                <td>
                  <div className="edit_timestamp">{song.edit_timestamp}</div>
                </td>
              </tr>
            );
          }
        )
      );
    });

    return (
      <div className="admin_list">
        <input
          id="admin_search"
          onChange={this.handleChange}
          placeholder="Search"
          value={window.history.state ? window.history.state.search : ''}
        />
        <table className="admin_table">
          <tbody>{list}</tbody>
        </table>
      </div>
    );
  }
}
