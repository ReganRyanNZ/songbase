const IndexOfBooks = ({ goToBookIndex, books, homeButton }) => {
  const bookClicked = ({ target }) => {
    let bookSlug = target.closest('.index_row').id;
    goToBookIndex(bookSlug);
  };
  return (
    <div>
      {homeButton}
      {books.map((book, i) => {
        return (
          <div
            className="index_row"
            key={i}
            id={book.slug}
            onClick={bookClicked}
          >
            <span className="index_row_title">{book.name}</span>
          </div>
        );
      })}
    </div>
  );
};
