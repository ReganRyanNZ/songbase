// LanguageLinks component with add-to-screen functionality
// Shows links to navigate plus buttons to add translations to current page

const LanguageLinks = ({ 
  linkIds, 
  songs, 
  setSong, 
  hasBookRefsToo,
  selectedLanguages,
  activeTranslations,
  addTranslation,
  removeTranslation,
  currentSongId
}) => {
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  if (!linkIds || linkIds.length === 0) {
    return "";
  }

  // Get all linked songs
  const linkedSongs = linkIds
    .map(id => songs.find(song => song.id == id))
    .filter(song => song !== undefined);

  // Filter by selected languages
  const filteredSongs = selectedLanguages 
    ? linkedSongs.filter(song => selectedLanguages.includes(song.lang))
    : linkedSongs;

  // Sort by language
  filteredSongs.sort((a, b) => (a.lang < b.lang ? -1 : a.lang > b.lang ? 1 : 0));

  // Get songs that are currently displayed as translations
  const displayedTranslations = activeTranslations
    .map(id => songs.find(song => song.id == id))
    .filter(song => song !== undefined);

  // Handle add/remove translation click
  const handleToggleTranslation = (e, songId) => {
    e.stopPropagation(); // Prevent navigation
    if (activeTranslations.includes(songId)) {
      removeTranslation(songId);
    } else {
      addTranslation(songId);
    }
  };

  const linkList = (
    <div className={`lang-link-list ${filteredSongs.length > 0 && hasBookRefsToo ? "with-line" : ""}`}>
      {/* Links with add buttons */}
      {filteredSongs.map(song => {
        const isDisplayed = activeTranslations.includes(song.id);
        return (
          <div 
            key={song.id} 
            className="language_link_row"
          >
            <div 
              className="language_link song_link" 
              id={song.id} 
              onClick={setSong}
              language={song.lang}
            >
              {`${capitalize(song.lang)}: ${song.title}`}
            </div>
            <button
              className={`add-translation-btn ${isDisplayed ? 'displayed' : ''}`}
              onClick={(e) => handleToggleTranslation(e, song.id)}
              title={isDisplayed ? "Remove from page" : "Add to current page"}
            >
              {isDisplayed ? '×' : '+'}
            </button>
          </div>
        );
      })}
    </div>
  );

  return <div className="lang-links">{linkList}</div>;
};
