// Key thing here is the prop "bookRefs",
// Which is an array of [book_slug, book_name, book_index]

const SongReferences = ({
  loadingData,
  bookRefs,
  goToBookIndex,
  toggleOrderIndexBy,
  scrollToSong,
}) => {
  if (loadingData || !bookRefs) {
    return null;
  }
  let handleClick = (e) => {
    goToBookIndex(e.target.id);
    toggleOrderIndexBy('number');
    scrollToSong(e.target.dataset.songindex);
  };
  // console.log('Loading bookRefs:');
  // console.log(bookRefs);
  return (
    <div className="song-references">
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
    </div>
  );
};
