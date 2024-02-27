const SongReferences = ({
  loadingData,
  bookRefs, // an array of [book_slug, book_name, book_index]
  goToBookIndex,
  toggleOrderIndexBy,
  scrollToSong,
  linkIds,
  songs,
  setSong,
  toggleReferenceLinks,
  showReferenceLinks}) => {

  if (loadingData || !bookRefs) {
    return null;
  }

  let handleClick = (e) => {
    goToBookIndex(e.target.id);
    toggleOrderIndexBy('number');
    scrollToSong(e.target.dataset.songindex);
  };

  const button = (
    <button
      onClick={toggleReferenceLinks}
      className="song-reference-toggle">
      <GlobeIcon />
    </button>
  )

  const bookRefsExist = bookRefs && bookRefs.length > 0
  const langRefsExist = linkIds && linkIds.length > 0
  if (!bookRefsExist && !langRefsExist) { return "" }


  const langLinks = langRefsExist ? (<LanguageLinks
                                      linkIds={linkIds}
                                      songs={songs}
                                      setSong={setSong}
                                      toggleReferenceLinks={toggleReferenceLinks}
                                      showReferenceLinks={showReferenceLinks}
                                      hasBookRefsToo={bookRefs.length > 0}
                                    />) : ""

  return showReferenceLinks ? (
    <div className="song-references" id="song-references">
      {bookRefs.map((ref) => {
        let slug = ref[0];
        let name = ref[1];
        let index = ref[2];
        return (
          <div
            className="song-reference"
            key={slug}
            id={slug}
            data-songindex={index}
            onClick={handleClick}
          >
            {name + ': #' + index}
          </div>
        );
      })}

      {langLinks}
      {button}
    </div>
  ) : button
}
