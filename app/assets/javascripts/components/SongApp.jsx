class SongApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: (props.songId || 'index')
    }

    this.setSong = this.setSong.bind(this);
    this.setSongFromHistory = this.setSongFromHistory.bind(this);
    this.getSong = this.getSong.bind(this);
    this.returnToIndex = this.returnToIndex.bind(this);
    this.getLanguages = this.getLanguages.bind(this);

    if(this.state.page == 'index') {
      window.history.replaceState({page: 'index'}, '', '/');
    } else {
      window.history.replaceState({page: this.state.page}, '', '/?s=' + this.state.page);
    }
  }

  componentDidMount() {
    window.addEventListener("popstate", this.setSongFromHistory);
  }

  returnToIndex(e) {
    this.setState({page: 'index'});
    window.history.pushState({page: 'index'}, '', '/');
    $('html,body').scrollTop(0);
  }

  setSongFromHistory(e) {
    if(e.state.page){
      e.preventDefault(); // stop request to server for new html
      e.stopPropagation();
      this.setState({page: e.state.page});
      $('html,body').scrollTop(0);
    }
  }

  setSong(e) {
    var songId = e.target.id;
    this.setState({page: songId});
    window.history.pushState({page: songId}, '', '?s='+songId);
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

  // get a list of unique languages in the db
  getLanguages() {
    songs = this.props.songData;
    return songs.map(s => s.model.lang).filter((v, i, a) => a.indexOf(v) === i);
  }

  render() {
    var page = "settings";// this.state.page;
    var content;
    switch(page) {
      case "index":
        content = <SongIndex songData={this.props.songData} setSong={this.setSong}/>
        break;
      case "settings":
        content = <UserSettings languages={this.getLanguages()}/>
        break;
      default:
        content = <SongDisplay lyrics={ this.getSong(page).model.lyrics } />
    }
    return(
      <div className="song-app">
        <h1 className="home-title" onClick={this.returnToIndex}>Songbase</h1>
        {content}
      </div>
    )
  }
}