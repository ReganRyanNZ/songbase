class BookIndex extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var handleClick = (e)=> {
      var bookSlug = e.target.closest(".index_row").id;
      this.props.goToBookIndex(bookSlug);
    }
    return (
      <div>
      {
        this.props.books.map(function(book, i) {
          return (
            <div
              className="index_row"
              key={i}
              id={book.slug}
              onClick={handleClick}
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