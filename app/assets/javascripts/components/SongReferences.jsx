const SongReferences = ({
  loadingData,
  references,
  books,
  goToBookIndex,
  toggleOrderIndexBy,
  scrollToSong,
}) => {
  if (loadingData) {
    return null;
  }
  return (
    <div className="song-references">
      {references.map((ref) => {
        var book = books.find((book) => book.id == ref.book_id);
        var handleClick = (e) => {
          goToBookIndex(e.target.id);
          toggleOrderIndexBy('number');
          scrollToSong(e.target.dataset.songindex);
        };
        return (
          <div
            className="song-reference"
            key={book.slug}
            id={book.slug}
            data-songindex={ref.index}
            onClick={handleClick}
          >
            {book.name + ': #' + ref.index}
          </div>
        );
      })}
    </div>
  );
};
