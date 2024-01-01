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

    const csrfToken = document.querySelector("meta[name=csrf-token]").content;
    const searchParams = new URLSearchParams({ search });

    fetch("/api/v2/admin_songs?" + searchParams.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      }
    })
      .then(response => response.json())
      .then(data => { app.setState({ songs: data.songs }) })
      .catch(error => console.error("Error:", error));
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
