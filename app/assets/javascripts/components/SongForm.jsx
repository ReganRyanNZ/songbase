class SongForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lyrics: this.props.song.lyrics || "",
      title: this.props.song.title || "",
      lang: this.props.song.lang || "english",
      book_refs: this.props.book_refs
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    switch (event.target.id) {
      case "song_lyrics":
        this.setState({ lyrics: event.target.value });
        break;
      case "song_title":
        this.setState({ title: event.target.value });
        break;
      case "song_lang":
        this.setState({ lang: event.target.value });
        break;
    }
  }

  render() {
    let language_options = [];
    let langs = this.props.languages;
    for (let i = 0; i < langs.length; i++) {
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

    let new_lang;
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

    let songTitleBeef = "\n\
    Dear saints, for the sake of uniformity and usability, please consider the following:\n\
    - If you have a custom title (e.g. \"Hebrews Medley\"), you can put it after the first line: \"Christ our High Priest (Hebrews Medley)\"\n\
    - Likewise for a verse reference (e.g. \"Matthew 16:18-19\"), better to put it after the first line: \"And I also say to you that you are Peter (Matthew 16:18-19)\"\n\
    - Do not duplicate an existing title\n\
    - Do not put a conference or event in the title (e.g. \"As the Spirit God came - SSOT14—Two Spirits\"). It is better to put this in a comment within the song.\n\
    - Do not use all-caps (e.g. FOR THE BREAD AND FOR THE WINE), it's much better to write the title as a sentence: \"For the bread and for the wine\"\n\
    "

    let titleComponent = (<div className="titles">
                            <h2>Index title</h2>
                            <p className="admin-comment">
                              {songTitleBeef}
                            </p>
                            <input
                              id="song_title"
                              placeholder="Title (usually the first line)"
                              className="song-form-title"
                              type="text"
                              value={this.state.title}
                              name="song[title]"
                              onChange={this.handleChange}
                            />
                          </div>);

    let languageComponent = (<div className="languages">
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
                              </div>);

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
            bookRefs={this.props.bookRefs}
          />
        </div>

        {this.props.exampleForm ? '' : titleComponent}
        {this.props.exampleForm ? '' : languageComponent}
      </div>
    );
  }
}
