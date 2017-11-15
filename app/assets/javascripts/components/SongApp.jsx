class SongApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      song: ''
    }

    this.setSong = this.setSong.bind(this);
    this.getSong = this.getSong.bind(this);
    // this.handleSubmit = this.handleSubmit.bind(this);
  }

  setSong(e) {
    this.setState({song: e.target.id})
  }

  getSong(id) {
    songs = this.props.songData
    for(var i=0; i < songs.length; i++){
      if(songs[i].model.id == id) {
        return songs[i];
      }
    }
    return "couldn't find song"
  }

  render() {
    var id = this.state.song;

    var content = id ? <SongDisplay lyrics={ this.getSong(id).model.lyrics } /> : <SongIndex songData={this.props.songData} setSong={this.setSong}/>
    return(
      <div className="song-app">
        {content}
      </div>
    )
  }
}