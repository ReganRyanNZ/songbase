class AdminBookList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      books: props.books || [],
      users: props.users || []
    };
  }

  handleBookClick(book_slug) {
    window.location.href = `/books/admin/${book_slug}`;
  }

  getUserNameFromAdminID(adminID) {
    const user = this.state.users.find(user => user.id === adminID);
    return user.name;
  }

  render() {

    return (
      <div className="admin_book_list">
        {this.state.books.map((book) => (
          <div
            className="index_row"
            key={book.id}
            id={book.slug}
            onClick={(e) => {
              e.preventDefault();
              this.handleBookClick(book.slug);
            }}
            style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
          >
            <span className="index_row_title">{book.name}</span>
            <span>{this.getUserNameFromAdminID(book.admin)}</span>
            <span className="index_row_languages">
              {book.languages
                .map(lang => lang.charAt(0).toUpperCase() + lang.slice(1))
                .join(', ')}
            </span>
          </div>
        ))}
      </div>
    );
  }
}
