class SongForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.props.song.lyrics ? {lyrics: this.props.song.lyrics} : {lyrics: ''};

    this.handleChange = this.handleChange.bind(this);
    // this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    switch(event.target.id) {
      case "song_lyrics":
        this.setState({lyrics: event.target.value});
        break;
      case "song_firstline_title":
        this.setState({firstline_title: event.target.value});
        break;
      case "song_chorus_title":
        this.setState({chorus_title: event.target.value});
        break;
      case "song_custom_title":
        this.setState({custom_title: event.target.value});
        break;
    }
  }

  render() {
    return (
      <div className="song-form pure-g">
        <div className="form pure-u-1-2" >
          <textarea
            id="song_lyrics"
            value={this.state.lyrics}
            onChange={this.handleChange}
            name="song[lyrics]"
            className="song-form-textbox"
            placeholder="Enter song lyrics here..." />
        </div>
        <div className="preview pure-u-1-2" >
          <SongDisplay lyrics={this.state.lyrics} />
        </div>
        <div className="titles">
          {/*<SongTitleInput type="firstline"*/}
          <div className="pure-u-1-1">
          First: {this.state.firstline_title}
          <br/>
          Chorus: {this.state.chorus_title}
          <br/>
          Custom: {this.state.custom_title}
          <br/>
          </div>
          <input
            id="song_firstline_title"
            placeholder="First line"
            className="song-form-title"
            type="text"
            value={this.state.firstline_title}
            name="song[firstline_title]"
            onChange={this.handleChange} />
          <input
            id="song_chorus_title"
            placeholder="Chorus first line"
            className="song-form-title"
            type="text"
            value={this.state.chorus_title}
            name="song[chorus_title]"
            onChange={this.handleChange} />
          <input
            id="song_custom_title"
            placeholder="Custom title"
            className="song-form-title"
            type="text"
            value={this.state.custom_title}
            name="song[custom_title]"
            onChange={this.handleChange} />
        </div>
      </div>
    );
  }
}