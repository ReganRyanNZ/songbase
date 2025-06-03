class AdminBookForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      bookSongs: props.initialBookSongs || [],
      songs: props.songs || [],
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleAddSong = this.handleAddSong.bind(this);
    this.handleRemoveSong = this.handleRemoveSong.bind(this);
    this.handleLangChange = this.handleLangChange.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  handleSearchChange(e) {
    this.setState({ search: e.target.value });
  }

  handleAddSong(song) {
    const { bookSongs } = this.state;

    const alreadyAdded = bookSongs.find((s) => s.id === song.id);
    if (!alreadyAdded) {
      const updatedSongs = [...bookSongs, { ...song }];
      this.setState({ bookSongs: updatedSongs });
    }
  }

  handleRemoveSong(index) {
    const updatedSongs = [...this.state.bookSongs];
    updatedSongs.splice(index, 1);
    this.setState({ bookSongs: updatedSongs });
  }

  handleLangChange(index, newLang) {
    const updatedSongs = [...this.state.bookSongs];
    updatedSongs[index].lang = newLang;
    this.setState({ bookSongs: updatedSongs });
  }

  handleDragStart(e, index) {
    e.dataTransfer.setData("dragIndex", index);
  }

  handleDrop(e, dropIndex) {
    var dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
    var updatedSongs = this.state.bookSongs.slice();
    var dragged = updatedSongs.splice(dragIndex, 1)[0];
    updatedSongs.splice(dropIndex, 0, dragged);
    this.setState({ bookSongs: updatedSongs });
  }

  strip(string, normalize = true) {
    let result = normalize ? string.normalize("NFD") : string;

    result = result
      .replace(/[\_\-—–]/g, " ")
      .toUpperCase()
      .replaceAll("\n", " ")
      .replace(/(\[.+?\])|[’'",“!?()\[\]]|[\u0300-\u036f]/g, "");

    return result;
  }
  filterAndSortSongs(songs, search) {
    const strippedSearch = this.strip(search);
    const titleStartsWithSearch = new RegExp("^" + strippedSearch, "i");
    const titleContainsSearch = new RegExp(strippedSearch, "i");

    return songs
      .filter((song) => {
        const strippedTitle = this.strip(song.title);
        return titleContainsSearch.test(strippedTitle);
      })
      .sort((a, b) => {
        const titleA = this.strip(a.title);
        const titleB = this.strip(b.title);

        const getRelevance = (title) => {
          if (titleStartsWithSearch.test(title)) return 2;
          if (titleContainsSearch.test(title)) return 1;
          return 0;
        };

        const relevanceA = getRelevance(titleA);
        const relevanceB = getRelevance(titleB);

        if (relevanceA !== relevanceB) {
          return relevanceB - relevanceA;
        }

        return titleA.localeCompare(titleB);
      })
  }

  render() {
    const { search, bookSongs, songs } = this.state;
    const filteredSongs = this.filterAndSortSongs(songs, search).slice(0,100);

    const filterBookSongs = bookSongs.filter((song) => song.title.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="admin-book-form">
        <div className="search-form form" key="search-form">
          <input
            id="index_search"
            autoComplete="off"
            value={search}
            onChange={this.handleSearchChange}
            name="song[search]"
            className="index_search"
            placeholder="search..."
            key="search-input"
          />
          {search.length > 0 ? (
            <div className="btn_clear_search" onClick={this.props.clearSearch}>
              ×
            </div>
          ) : null}
        </div>

        <div className="songs-container">
          <div className="songs-search">
            <h3>Songbase Songs</h3>
            {filteredSongs.map((song) => (
              <div className="song-item" key={song.id}>
                {song.title}
                <button onClick={() => this.handleAddSong(song)}>Add</button>
              </div>
            ))}
          </div>

          <div className="book-songs">
            <h3>Book Songs</h3>
            {filterBookSongs.map((song, index) => (
              <div
                className="song-item"
                key={song.id}
                draggable
                onDragStart={(e) => this.handleDragStart(e, index)}
                onDrop={(e) => this.handleDrop(e, index)}
                onDragOver={(e) => e.preventDefault()}
              >
                #{index + 1} {song.title}
                <button onClick={() => this.handleRemoveSong(index)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
