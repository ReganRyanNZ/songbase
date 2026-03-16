const IndexOfBooks = ({ goToBookIndex, books, languages, homeButton, canEditBook, editUrlFor }) => {
  const bookClicked = ({ target }) => {
    let bookSlug = target.closest('.index_row').id;
    goToBookIndex(bookSlug);
  };
  const scopeBooksToLanagues = ((books, languages) => {
    return books.filter(book => book.languages.some((book_lang) => languages.includes(book_lang)));
  })
  return (
    <div>
      {homeButton}
      {scopeBooksToLanagues(books, languages).map((book, i) => {
        const editUrl = (canEditBook && editUrlFor && canEditBook(book.id)) ? editUrlFor(book.id) : null;
        return (
          <div
            className="index_row"
            key={i}
            id={book.slug}
            onClick={bookClicked}
          >
            <span className="index_row_title">
              {book.name}
              {editUrl && (
                <a
                  href={editUrl}
                  className="book-edit-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EditIcon />
                </a>
              )}
            </span>
          </div>
        );
      })}
      <a href="/books/new" className="index_row create-book-btn">
        <span className="index_row_title">+ Create new book</span>
      </a>
    </div>
  );
};
