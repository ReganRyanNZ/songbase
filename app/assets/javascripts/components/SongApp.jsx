class SongApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      song: (props.songId || 'index')
    }

    this.setSong = this.setSong.bind(this);
    this.setSongFromHistory = this.setSongFromHistory.bind(this);
    this.getSong = this.getSong.bind(this);
    this.returnToIndex = this.returnToIndex.bind(this);

    if(this.state.song == 'index') {
      window.history.replaceState({song: 'index'}, '', '/');
    }
  }

  componentDidMount() {
    window.addEventListener("popstate", this.setSongFromHistory);
  }

  returnToIndex(e) {
    this.setState({song: 'index'});
    window.history.pushState({song: 'index'}, '', '/');
    $('html,body').scrollTop(0);
  }

  setSongFromHistory(e) {
    if(e.state.song){
      e.preventDefault(); // stop request to server for new html
      e.stopPropagation();
      this.setState({song: e.state.song});
      $('html,body').scrollTop(0);
    }
  }

  setSong(e) {
    var songId = e.target.id;
    this.setState({song: songId});
    window.history.pushState({song: songId}, '', '?s='+songId);
    $('html,body').scrollTop(0);
  }

  getSong(id) {
    songs = this.props.songData;
    for(var i=0; i < songs.length; i++){
      if(songs[i].model.id == id) {
        return songs[i];
      }
    }
    return "couldn't find song";
  }

  render() {
    var id = this.state.song;
    var content;
    if(id != 'index'){
      content = <SongDisplay lyrics={ this.getSong(id).model.lyrics } />
    } else {
      content = <SongIndex songData={this.props.songData} setSong={this.setSong}/>
    }
    return(
      <div className="song-app">
        <h1 className="home-title" onClick={this.returnToIndex}>Songbase</h1>
        {content}
      </div>
    )
  }
}