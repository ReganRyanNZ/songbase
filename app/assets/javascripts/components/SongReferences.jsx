class SongReferences extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.loadingData) {
      return null;
    }
    return (
      <div className="song-references">
        {this.props.references.map(ref => {
          var book = this.props.books.find(book => book.id == ref.book_id);
          var handleClick = (e)=> {
            this.props.goToBookIndex(e.target.id);
            this.props.toggleOrderIndexBy('number');
            this.props.scrollToSong(e.target.dataset.songindex);
          }
          return (
            <div className="song-reference" key={book.slug} id={book.slug} data-songindex={ref.index} onClick={handleClick} >
              {book.name +
                ": #" +
                ref.index}
            </div>
          );
        }, this)}
      </div>
    );
  }
}
