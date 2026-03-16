const IndexOfBooks = ({ goToBookIndex, books, languages, homeButton, canEditBook, editUrlFor, onRemoveBook, booksToSync }) => {
  const bookClicked = ({ target }) => {
    let bookSlug = target.closest('.index_row').id;
    goToBookIndex(bookSlug);
  };
  const scopeBooksToLanagues = ((books, languages) => {
    const filtered = books.filter(book => book.languages.some((book_lang) => languages.includes(book_lang)));
    // Sort: sync_to_all books first (alphabetically), then others alphabetically
    return filtered.sort((a, b) => {
      const aIsSyncToAll = a.sync_to_all !== false;
      const bIsSyncToAll = b.sync_to_all !== false;
      if (aIsSyncToAll && !bIsSyncToAll) return -1;
      if (!aIsSyncToAll && bIsSyncToAll) return 1;
      // Both same sync_to_all status, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  })
  return (
    <div>
      {homeButton}
      {scopeBooksToLanagues(books, languages).map((book, i) => {
        const editUrl = (canEditBook && editUrlFor && canEditBook(book.id)) ? editUrlFor(book.id) : null;
        const isInSyncList = booksToSync.map(String).includes(String(book.id));
        const showKabob = isInSyncList || editUrl || book.sync_to_all; // Show kabob if user can edit, book is in sync list, or sync_to_all
        const showTrash = isInSyncList || book.sync_to_all; // Show trash for books actually on the device

        return (
          <div
            className="index_row"
            key={i}
            id={book.slug}
            onClick={bookClicked}
          >
            <span className="index_row_title">
              {book.name}
              {showKabob && (
                <KabobMenu
                  canEdit={!!editUrl}
                  editUrl={editUrl}
                  showTrash={showTrash}
                  onRemove={() => onRemoveBook(book.id)}
                  bookSlug={book.slug}
                  bookId={book.id}
                />
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
