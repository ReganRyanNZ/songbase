class AdminSongList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songs: []
    };
  }

  componentDidMount() {
    let historyState = window.history.state;
    let value = '';

    if(historyState) {
      value = historyState.search || '';
      document.getElementById('admin_search').value = value;
    }

    this.updateSongList(value);
  }

  handleChange(event) {
    let search = event.target.value;
    // Update browser history to keep search value if the user navigates back out of a song
    window.history.replaceState({ search: search }, "");
    this.updateSongList(search);
  }

  updateSongList(search) {
    let app = this;

    axios({
      method: "GET",
      url: "/api/v2/admin_songs",
      params: { search: search },
      headers: { "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content }
    }).then(function(response) {
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
          onChange={this.handleChange.bind(this)}
          placeholder="Search"
        />
        <table className="admin_table">
          <tbody>{list}</tbody>
        </table>
      </div>
    );
  }
}
