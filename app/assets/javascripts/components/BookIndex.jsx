class BookIndex extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
      {
        this.props.books.map(function(book, i) {
          return (
            <div
              className="index_row"
              key={i}
              id={book.slug}
              onClick={this.props.setBook}
            >
              <span className="index_row_title">{book.name}</span>
            </div>
          )
        }, this)
      }
    </div>
    );
  }
}