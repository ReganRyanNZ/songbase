class AdminSongList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search: ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.linkClassName = this.linkClassName.bind(this);
    this.filterSongs = this.filterSongs.bind(this);
  }

  handleChange(event) {
    switch(event.target.id) {
      case "admin_search":
        this.setState({search: event.target.value});
        break;
    }
  }

  linkClassName(review_type) {
    if(review_type == "duplicate") {
      return "requires-review-duplicate";
    }
    if(review_type == "changed") {
      return "requires-review-changed";
    }
    return "";
  }

  filterSongs(songs, search) {
    // get rid of punctuation and chords
    var stripString = function(str) {
      str = str.replace(/\_/g, ' ');
      return str.replace(/(\[.+?\])|[’'",“\-—–!?()0-9\[\]]/g, '');
    }
    var strippedSearch = stripString(search);
    var titleMatchRegex = new RegExp(strippedSearch, 'i');
    var lyricsMatchRegex = new RegExp(strippedSearch, 'i');

    // filter songs by language settings
    return searchResults = songs.filter(function(song) {
      return (
        this.props.settings.languages.includes(song.lang) && //language match
        (
          Object.values(song.references).includes(search) || //index match
          titleMatchRegex.test(stripString(song.title)) || //title match;
          lyricsMatchRegex.test(stripString(song.lyrics))
        )
      )
    }, this);

  }

  render() {
    var list = Object.keys(this.props.songs).map(function(review_type, i){
      return [].concat.apply([], this.filterSongs(this.props.songs[review_type], this.state.search).map(function(obj, i){
        var editClass = "edit_song_link " + this.linkClassName(review_type);
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
              <a className={editClass} href={editRef}>{obj.title}</a>
            </td>
            <td>
              {removeLink}
            </td>
            <td>
              <div className="last_edited">{obj.last_editor}</div>
            </td>
            <td>
              <div className="edit_timestamp">{obj.timestamp}</div>
            </td>
          </tr>
        )
      }, this));
    }, this);

    return(
      <div className="admin_list">
        <input
          id="admin_search"
          onChange={this.handleChange}
          placeholder="Search"
        />
        <table className="admin_table">
          <tbody>
            {list}
          </tbody>
        </table>
      </div>
    );
  }
}