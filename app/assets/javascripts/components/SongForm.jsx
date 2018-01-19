class SongForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lyrics: this.props.song.lyrics || '',
      firstline_title: this.props.song.firstline_title || '',
      chorus_title: this.props.song.chorus_title || '',
      custom_title: this.props.song.custom_title || '',
      lang: this.props.song.lang || 'english'
    }

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    switch(event.target.id) {
      case "song_lyrics":
        var target   = event.target;
        target.value = target.value.replace(/(^|\n)SC/, "$1{start_of_chorus}");
        target.value = target.value.replace(/(^|\n)EC/, "$1{end_of_chorus}");
        target.value = target.value.replace(/(^|\n)NN/, "$1{no_number}");

        this.setState({lyrics: target.value});
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
      case "song_lang":
        this.setState({lang: event.target.value});
        break;
    }
  }

  render() {
    language_options = []
    langs = this.props.languages;
    for(var i=0; i < langs.length; i++) {
      language_options.push(<option value={langs[i]}>{langs[i]}</option>);
    }
    language_options.push(<option value="new_lang">create new language</option>);

    var new_lang;
    if(this.state.lang == "new_lang") {
      new_lang = <input
        id="song_new_lang"
        placeholder="new language"
        className="song-form-title"
        type="text"
        name="song[new_lang]"
      />
    } else {
      new_lang = null;
    }

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
        <div className="titles pure-u-1-1">
          <h2>Indexing titles</h2>
          <p className="admin-comment">
            These titles will appear on a songbook's index page. Every song must have at least one title (usually the first line).
          </p>
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
        <div className="languages pure-u-1-1">
          <h2>Language</h2>
          <select
            id="song_lang"
            name="song[lang]"
            onChange={this.handleChange}
            value={this.state.lang}>
            {language_options}
          </select>
          <div className="new_lang">
            {new_lang}
          </div>
        </div>
      </div>
    );
  }
}