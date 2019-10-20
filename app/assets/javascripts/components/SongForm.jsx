class SongForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lyrics: this.props.song.lyrics || "",
      firstline_title: this.props.song.firstline_title || "",
      lang: this.props.song.lang || "english",
      references: this.props.references || {},
      books: this.props.books
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    switch (event.target.id) {
      case "song_lyrics":
        this.setState({ lyrics: event.target.value });
        break;
      case "song_firstline_title":
        this.setState({ firstline_title: event.target.value });
        break;
      case "song_lang":
        this.setState({ lang: event.target.value });
        break;
    }
  }

  render() {
    language_options = [];
    langs = this.props.languages;
    for (var i = 0; i < langs.length; i++) {
      language_options.push(
        <option value={langs[i]} key={langs[i]}>
          {langs[i][0].toUpperCase() + langs[i].slice(1)}
        </option>
      );
    }
    language_options.push(
      <option value="new_lang" key="new_lang">
        Create new language
      </option>
    );

    var new_lang;
    if (this.state.lang == "new_lang") {
      new_lang = (
        <input
          id="song_new_lang"
          placeholder="new language"
          className="song-form-title"
          type="text"
          name="song[new_lang]"
        />
      );
    } else {
      new_lang = null;
    }

    return (
      <div className="song-form">
        <div className="form">
          <textarea
            id="song_lyrics"
            value={this.state.lyrics}
            onChange={this.handleChange}
            name="song[lyrics]"
            className="song-form-textbox"
            placeholder="Enter song lyrics here..."
          />
        </div>
        <div className="preview">
          <SongDisplay lyrics={this.state.lyrics} />
          <SongReferences
            references={this.state.references}
            books={this.state.books}
          />
        </div>
        <div className="titles">
          <h2>Index title</h2>
          <p className="admin-comment">
            This title will appear on a songbook's index page.
          </p>
          <input
            id="song_firstline_title"
            placeholder="Title (usually the first line)"
            className="song-form-title"
            type="text"
            value={this.state.firstline_title}
            name="song[firstline_title]"
            onChange={this.handleChange}
          />
        </div>
        <div className="languages">
          <h2>Language</h2>
          <select
            id="song_lang"
            name="song[lang]"
            onChange={this.handleChange}
            value={this.state.lang}
          >
            {language_options}
          </select>
          <div className="new_lang">{new_lang}</div>
        </div>
      </div>
    );
  }
}
