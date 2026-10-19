class LanguageLinksEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      linkedSongs: props.linkedSongs || [],
      searchResults: [],
      searchQuery: '',
      isSearching: false,
      focusedIndex: -1
    };

    this.searchTimeout = null;
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.addLink = this.addLink.bind(this);
    this.removeLink = this.removeLink.bind(this);
    this.performSearch = this.performSearch.bind(this);
  }

  componentDidMount() {
    // Update hidden input with initial values
    this.updateHiddenInput();
  }

  componentDidUpdate(prevProps, prevState) {
    // Update hidden input when links change
    if (prevState.linkedSongs !== this.state.linkedSongs) {
      this.updateHiddenInput();
    }
  }

  updateHiddenInput() {
    const hiddenInput = document.getElementById('song_language_links');
    if (hiddenInput) {
      const ids = this.state.linkedSongs.map(s => s.id);
      hiddenInput.value = ids.join(',');
    }
  }

  handleChange(event) {
    const query = event.target.value;
    this.setState({ searchQuery: query, focusedIndex: -1 });

    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.trim().length > 0) {
      this.setState({ isSearching: true });
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    } else {
      this.setState({ searchResults: [], isSearching: false });
    }
  }

  performSearch(query) {
    const metaTag = document.querySelector("meta[name=csrf-token]");
    const csrfToken = metaTag ? metaTag.content : '';
    const searchParams = new URLSearchParams({ search: query });

    fetch("/api/v2/custom_book_search?" + searchParams.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      }
    })
      .then(response => response.json())
      .then(data => {
        // Filter out songs already linked and the current song
        const linkedIds = this.state.linkedSongs.map(s => s.id);
        const currentSongId = this.props.currentSongId;
        
        const filteredResults = (data.songs || []).filter(song => 
          !linkedIds.includes(song.id) && song.id !== currentSongId
        );

        this.setState({ 
          searchResults: filteredResults, 
          isSearching: false,
          focusedIndex: -1
        });
      })
      .catch(error => {
        console.error("Error searching songs:", error);
        this.setState({ isSearching: false });
      });
  }

  handleKeyDown(event) {
    const { searchResults, focusedIndex } = this.state;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (searchResults.length > 0) {
        this.setState({ 
          focusedIndex: focusedIndex < searchResults.length - 1 ? focusedIndex + 1 : 0 
        });
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (searchResults.length > 0) {
        this.setState({ 
          focusedIndex: focusedIndex > 0 ? focusedIndex - 1 : searchResults.length - 1 
        });
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
        this.addLink(searchResults[focusedIndex]);
      }
    } else if (event.key === 'Escape') {
      this.setState({ searchResults: [], searchQuery: '', focusedIndex: -1 });
    }
  }

  addLink(song) {
    const { linkedSongs } = this.state;
    
    // Check if already linked
    if (linkedSongs.some(s => s.id === song.id)) {
      return;
    }

    this.setState({
      linkedSongs: [...linkedSongs, song],
      searchResults: [],
      searchQuery: '',
      focusedIndex: -1
    });
  }

  removeLink(songId) {
    this.setState({
      linkedSongs: this.state.linkedSongs.filter(s => s.id !== songId)
    });
  }

  formatLang(song) {
    // Handle invalid lang values (e.g., numbers stored as strings)
    if (!song.lang || typeof song.lang !== 'string' || song.lang.match(/^\d+$/)) {
      return 'Unknown';
    }
    return song.lang.charAt(0).toUpperCase() + song.lang.slice(1);
  }

  formatSongDisplay(song) {
    const lang = this.formatLang(song);
    // Prefer title over first line (more reliable, avoids issues with verse numbers, etc.)
    const display = `${lang}: ${song.title}`;
    return display.length > 50 ? display.substring(0, 47) + '...' : display;
  }

  render() {
    const { linkedSongs, searchResults, searchQuery, isSearching, focusedIndex } = this.state;

    return (
      <div className="language-links">
        <h2>Language Links</h2>

        {/* Existing links as a simple list */}
        {linkedSongs.length > 0 ? (
          <div style={{ marginBottom: '10px' }}>
            {linkedSongs.map(song => (
              <div key={song.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #ddd' }}>
                <span>{this.formatSongDisplay(song)}</span>
                <button
                  type="button"
                  className="linked-song-remove"
                  onClick={() => this.removeLink(song.id)}
                  aria-label={`Remove ${song.title}`}
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-links-message">No language links yet. Search below to add translations.</p>
        )}

        {/* Search input */}
        <input
          id="language_links_search"
          type="text"
          placeholder="Search songs by title or lyrics..."
          value={searchQuery}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          className="song-form-title"
          style={{ marginBottom: '5px' }}
          autoComplete="off"
        />

        {/* Search results dropdown */}
        {searchQuery.length > 0 && searchResults.length > 0 && (
          <div style={{ border: '1px solid #ccc', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
            {searchResults.map((song, index) => (
              <div
                key={song.id}
                style={{ padding: '8px', cursor: 'pointer', backgroundColor: index === focusedIndex ? '#f0f7ff' : 'white' }}
                onClick={() => this.addLink(song)}
                onMouseEnter={() => this.setState({ focusedIndex: index })}
              >
                {this.formatLang(song)}: {song.title}
              </div>
            ))}
          </div>
        )}

        {/* Hidden input for form submission - maintains backward compatibility */}
        <input
          id="song_language_links"
          name="song[language_links][]"
          type="hidden"
          defaultValue={linkedSongs.map(s => s.id).join(',')}
        />

        <p className="admin-comment">
          Link translations of this song in other languages. When you add a link,
          it will automatically connect all translations together.
        </p>
      </div>
    );
  }
}
