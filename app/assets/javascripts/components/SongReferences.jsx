class SongReferences extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="song-references">
        {Object.keys(this.props.references).map(function(book_id, i) {
          return <div className="song-reference" key={i}>{this.props.allBooks[book_id]["name"] + ": #" + this.props.references[book_id]}</div>
        }, this)}
      </div>
    );
  }

}