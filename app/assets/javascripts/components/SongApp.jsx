class SongApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      song: ''
    }

    this.setSong = this.setSong.bind(this);
    // this.handleSubmit = this.handleSubmit.bind(this);
  }

  setSong(e) {
    this.setState({song: '226'})
  }


  render() {
    if(this.state.song) {
      return <SongDisplay lyrics={this.state.lyrics} />
    } else {
      return <SongIndex songData={this.props.songData} setSong={this.setSong}/>
    }
  }
}