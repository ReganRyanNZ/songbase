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
    var value = document.getElementById('admin_search').value
    this.updateSongList(value || '');
  }

  handleChange(event) {
    switch (event.target.id) {
      case "admin_search":
        this.updateSongList(event.target.value);
        break;
    }
  }

  linkClassName(reviewType) {
    if (reviewType == "duplicate") {
      return "requires-review-duplicate";
    }
    if (reviewType == "changed") {
      return "requires-review-changed";
    }
    return "";
  }

  updateSongList(search) {
    var app = this;

    axios({
      method: "GET",
      url: "/api/v1/admin_songs",
      params: { search: search },
      headers: { "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content }
    }).then(function(response) {
        console.log("Admin fetch completed.");
        app.setState({songs: response.data.songs});
      });
  }

  render() {
    var list = Object.keys(this.state.songs).map(function(reviewType, i) {
      return [].concat.apply(
        [],

        this.state.songs[reviewType].map(
          function(obj, i) {
            var editClass = "edit_song_link " + this.linkClassName(reviewType);
            var editRef = "/songs/" + obj.id + "/edit";
            var removeLink = "";

            // DELETE is broken without jquery. Old code kept in case we want a workaround
            // if(this.props.superAdmin) {
            //   var ref = "/songs/" + obj.id
            //   removeLink = <a data-confirm="Are you sure?" className="remove_song_link" rel="nofollow" data-method="delete" href={ref}>Remove</a>
            // }
            return (
              <tr key={obj.id}>
                <td>
                  <a className={editClass} href={editRef}>
                    {obj.title}
                  </a>
                </td>
                <td>{removeLink}</td>
                <td>
                  <div className="last_edited">{obj.last_editor}</div>
                </td>
                <td>
                  <div className="edit_timestamp">{obj.timestamp}</div>
                </td>
              </tr>
            );
          },
          this
        )
      );
    }, this);

    return (
      <div className="admin_list">
        <input
          id="admin_search"
          onChange={this.handleChange}
          placeholder="Search"
        />
        <table className="admin_table">
          <tbody>{list}</tbody>
        </table>
      </div>
    );
  }
}
