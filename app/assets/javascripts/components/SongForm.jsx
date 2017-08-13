class SongForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.props.song.lyrics ? {lyrics: this.props.song.lyrics} : {lyrics: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({lyrics: event.target.value});
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

        </div>
      </div>
    );
  }
}