class SongIndex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.filterSongs = this.filterSongs.bind(this);
  }

  handleChange(event) {
    switch(event.target.id) {
      case "index_search":
        this.setState({search: event.target.value});
        break;
    }
  }

  filterSongs() {
    var strippedSearch = this.state.search.replace(/[’'",“\-—–!?()]/g, '');
    var regex = new RegExp(strippedSearch, 'i');
    return this.props.songData.filter(function (song) {
      return regex.test(song.title.replace(/[’'",“\-—–!?()]/g, ''));
    })
  }

  render() {
    return (
      <div className="song-index pure-g">
        <div className="form pure-u-1-1" >
          <input
            id="index_search"
            value={this.state.search}
            onChange={this.handleChange}
            name="song[search]"
            className="index_search"
            placeholder="search..." />
        </div>
        <div className="title-list pure-u-1-1">
          {this.filterSongs().map(function(obj, i){
            return <div className="index_row">{obj.title}</div>;
          })}
        </div>

      </div>
    );
  }
}