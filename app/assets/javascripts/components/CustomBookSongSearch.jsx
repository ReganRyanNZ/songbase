class CustomBookSongSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songs: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.updateSongList = this.updateSongList.bind(this);
    this.keyNavigate = this.keyNavigate.bind(this);
    this.addToList = this.addToList.bind(this);
  }

  componentDidMount() {
    let historyState = window.history.state;
    let value = '';

    if(historyState) {
      value = historyState.search || '';
      document.getElementById('search_input').value = value;
    }

    this.updateSongList(value);
  }

  handleChange(event) {
    let search = event.target.value;
    // Update browser history to keep search value if the user navigates back out of a song
    window.history.replaceState({ search: search }, "");
    this.updateSongList(search);
  }

  updateSongList(search) {
    let app = this;

    axios({
      method: "GET",
      url: "/api/v2/custom_book_search",
      params: { search: search },
      headers: { "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content }
    }).then(function(response) {
        app.setState({songs: response.data.songs});
      });
  }

  addToList(e) {
    addSong([e.target.id, e.target.textContent]) // WARNING reaching into other places for this function
  }

  keyNavigate(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const insideSearch = e.currentTarget.tagName == 'DIV';
      let sibling;

      if (e.key === 'ArrowDown') {
        const listTop = document.querySelector(".custom_book_search_list > button:first-of-type");
        sibling = insideSearch ? listTop : e.currentTarget.nextSibling;
      }
      if (e.key === 'ArrowUp') {
        const listBottom = document.querySelector(".custom_book_search_list > button:last-of-type");
        sibling = insideSearch ? listBottom : e.currentTarget.previousSibling;
      }

      if (sibling) {
        sibling.focus();
      } else {
        document.querySelector("#search_input").focus(); // end of list, go back to search input
      }
    }
  }

  render() {
    let createSearchRow = (song) => {
      return (<button
                className="index_row"
                key={song.id}
                id={song.id}
                onClick={this.addToList}
                onKeyDown={this.keyNavigate}
              >
                <div className="index_row_title">
                  {song.title}
                </div>
              </button>)
    }

    let list = this.state.songs.map(createSearchRow);

    return (
      <div className="custom_book_search_list">
        <input
          id="search_input"
          onChange={this.handleChange}
          placeholder="Search"
        />
        <div className="custom_book_search_results">
          {list}
        </div>
      </div>
    );
  }
}
