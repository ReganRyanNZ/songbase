const SongReferences = ({
  loadingData,
  references,
  goToBookIndex,
  toggleOrderIndexBy,
  scrollToSong,
}) => {
  if (loadingData) {
    return null;
  }
  let handleClick = (e) => {
    goToBookIndex(e.target.id);
    toggleOrderIndexBy('number');
    scrollToSong(e.target.dataset.songindex);
  };
  // console.log('Loading references:');
  // console.log(references);
  return (
    <div className="song-references">
      {references.map((ref) => {
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
