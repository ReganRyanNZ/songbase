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

  handleSubmit(event) {
    alert('Still working on it, but this is the state: ' + this.state.lyrics);
    event.preventDefault();
  }

  render() {
    return (
      <div className="pure-g">
      <form onSubmit={this.handleSubmit} className="song-form pure-u-1-2" >
        <textarea
          id="song_lyrics"
          value={this.state.lyrics}
          onChange={this.handleChange}
          name="song[lyrics]"
          className="song-form-textbox"
          placeholder="Enter song lyrics here..." />
        <input type="submit" value="Submit" />
      </form>
      <SongDisplay lyrics={this.state.lyrics} />
      </div>
    );
  }
}