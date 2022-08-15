const IndexOfBooks = ({ goToBookIndex, books }) => {
  const handleClick = ({ target }) => {
    let bookSlug = target.closest('.index_row').id;
    goToBookIndex(bookSlug);
  };
  return (
    <div>
      {books.map(function (book, i) {
        return (
          <div
            className="index_row"
            key={i}
            id={book.slug}
            onClick={handleClick}
          >
            <span className="index_row_title">{book.name}</span>
          </div>
        );
      })}
    </div>
  );
};
