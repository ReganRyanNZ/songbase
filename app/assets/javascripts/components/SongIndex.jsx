class SongIndex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.filterSongs = this.filterSongs.bind(this);
  }

  handleChange(event) {
    switch(event.target.id) {
      case "index_search":
        this.setState({search: event.target.value});
        break;
    }
  }

  searchIsNumber() {
    var isNumberRegex = new RegExp("^[0-9]+$", 'i');
    return isNumberRegex.test(this.state.search);
  }

  filterSongs() {
    var stripString = function(str) {
      str = str.replace(/\_/g, ' ');
      return str.replace(/(\[.+?\])|[’'",“\-—–!?()0-9\[\]]/g, '');
    }
    var songs = this.props.songs;
    var reference_song_ids = this.props.references.map((ref) => ref.song_id);
    console.log(reference_song_ids);
    var strippedSearch = stripString(this.state.search);
    var searchResults;

    // filter songs by language settings
    // This is no longer needed while songs in state are set by language
    // songs = songs.filter(function(song) {
    //   return this.props.settings.languages.includes(song.lang);
    // }, this);

    if(this.searchIsNumber()) {
      var search = parseInt(this.state.search);
      searchResults = songs.filter(function(song) {
        return reference_song_ids.includes(search);
      }, this);
    } else {
      var titleStartRegex = new RegExp("^" + strippedSearch, 'i');
      var titleStart = songs.filter(function (song) {
        return titleStartRegex.test(stripString(song.title));
      }, this);

      var titleMatchRegex = new RegExp(strippedSearch, 'i');
      var titleMatch = songs.filter(function (song) {
        return titleMatchRegex.test(stripString(song.title));
      }, this);

      var lyricsMatchRegex = new RegExp(strippedSearch, 'i');
      var lyricsMatch = songs.filter(function (song) {
        return lyricsMatchRegex.test(stripString(song.lyrics));
      }, this);

      searchResults = titleStart
                        .concat(titleMatch)
                        .concat(lyricsMatch);
    }

    return searchResults.filter(function removeDuplicates(song, index, self) {
      return self.indexOf(song) === index;
    });

  }



  render() {
    getKeysByValue = function(object, value) {
      return Object.keys(object).filter(key => object[key] === value);
    }

    return (
      <div className="song-index">
        <div className="settings-btn" onClick={this.props.toggleSettingsPage}>
          <img src={this.props.images.settings_icon}/>
        </div>
        <div className="search-form form" >
          <input
            id="index_search"
            value={this.state.search}
            onChange={this.handleChange}
            name="song[search]"
            className="index_search"
            placeholder="search..." />
        </div>
        <div className="title-list">
          {
            this.props.songs.length <= 1 ?
              <div className="loading">Loading song data...</div>
            :
              this.filterSongs().map(function(song, i){
                var refKeys = [];
                var refs = '';
                if(this.searchIsNumber()) {

                  refKeys = getKeysByValue(references.song_id, this.state.search);
                  refs = refKeys.map(function(key, i) {
                    return (
                    <span className="index_row_ref" key={i}>
                      {this.props.allBooks[key].name}: #{song.references[key]}
                    </span>
                    );
                  }, this)
                }

                return (
                <div className="index_row" key={i} id={song.id} onClick={this.props.setSong}>
                  <span className="index_row_title">{song.title}</span>
                  {refs}
                </div>
                );
              }, this)
          }
        </div>

      </div>
    );
  }
}