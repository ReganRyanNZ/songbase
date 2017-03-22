class SongForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('Still working on it, but this is the state: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <div className="pure-g">
      <form onSubmit={this.handleSubmit} className="song-form pure-u-1-2" >
        <textarea
          value={this.state.value}
          onChange={this.handleChange}
          className="song-form-textbox" />
        <input type="submit" value="Submit" />
      </form>
      <SongDisplay lyrics={this.state.value} />
      </div>
    );
  }
}