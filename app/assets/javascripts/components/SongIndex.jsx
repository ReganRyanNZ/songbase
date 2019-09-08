class SongIndex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.getSearchResults = this.getSearchResults.bind(this);
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

  getSearchResults() {
    var stripString = function(str) {
      str = str.replace(/\_/g, ' ');
      return str.replace(/(\[.+?\])|[’'",“\-—–!?()\[\]]/g, '');
    }
    var songs = this.props.songs;
    var strippedSearch = stripString(this.state.search);
    var searchResults = [];
    var displayLimit = 100; // react gets laggy rendering 2k songs, so there's a limit

    // filter songs by language settings
    // This is no longer needed while songs in state are set by language
    // songs = songs.filter(function(song) {
    //   return this.props.settings.languages.includes(song.lang);
    // }, this);
    if(strippedSearch == '') {
      console.log("no search detected.");
      searchResults = songs.slice(0, displayLimit).map((song) => {
        return {
          song: song,
          tag: ''
        };
      });
    } else if(this.searchIsNumber()) {
      var search = parseInt(this.state.search);
      var refs = this.props.references.filter((ref) => ref.index == search);
      searchResults = refs.map((ref) => {
        var book = this.props.books.find((book) => book.id == ref.book_id);
        return {
          song: this.props.songs.find((song) => song.id == ref.song_id),
          tag: '<span class="search_tag">' + book.name + ': #' + ref.index + '</span>'
        }
      });
      return searchResults;
    } else {
      var titleStartRegex = new RegExp("^" + strippedSearch, 'i');
      var titleMatchRegex = new RegExp(strippedSearch, 'i');
      var lyricsMatchRegex = new RegExp(strippedSearch, 'i');

      searchResults = songs.filter((song) => {
        var title = stripString(song.title);
        var lyrics = stripString(song.lyrics);
        return (titleMatchRegex.test(title) || lyricsMatchRegex.test(lyrics));
      }, this).map((song) => {
        return {
          song: song,
          tag: ''
        };
      });

      // sort the results, making title matches appear higher than lyrics matches
      searchResults.sort((a, b) => {
        var titles = [stripString(a.song.title), stripString(b.song.title)];
        var weights = titles.map((title) => {
          if(titleStartRegex.test(title)) {
            return 2;
          } else if(titleMatchRegex.test(title)) {
            return 1;
          } else {
            return 0;
          }
        });

        // sort alphabetically if they are in the same regex category
        if (weights[0] == weights[1]) {
          if (titles[0] < titles[1])
            return -1;
          if ( titles[0] > titles[1])
            return 1;
          return 0;
        } else {
          return weights[1] - weights[0];
        }
      });
    }

    return searchResults.slice(0, displayLimit);
  }



  render() {
    getKeysByValue = function(object, value) {
      return Object.keys(object).filter(key => object[key] === value);
    }

    return (
      <div className="song-index">
        <div className="settings-btn" onClick={this.props.toggleSettingsPage}>
          <SettingsIcon/>
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
            !!this.props.loading_data ?
              <div className="loading">Loading song data...</div>
            :
              this.getSearchResults().map(function(result, i){
                return (
                <div className="index_row" key={i} id={result.song.id} onClick={this.props.setSong}>
                  <span className="index_row_title">{result.song.title}</span>
                  <span className="index_row_tag" dangerouslySetInnerHTML={{__html: result.tag}}/>
                </div>
                );
              }, this)
          }
        </div>

      </div>
    );
  }
}