const IndexOfBooks = ({ goToBookIndex, books, languages, homeButton }) => {
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
