class AdminBookList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { search: '', copied: null };
    this.copiedTimers = {};
  }

  componentWillUnmount() {
    Object.values(this.copiedTimers).forEach(clearTimeout);
  }

  filteredBooks() {
    const q = this.state.search.toLowerCase();
    if (!q) return this.props.books;
    return this.props.books.filter(b => b.name.toLowerCase().includes(q));
  }

  shareUrl(book) {
    return window.location.origin + '/?new_book=' + book.id;
  }

  shareEditUrl(book) {
    return window.location.origin + '/?new_book=' + book.id + '&edit_token=' + book.edit_token;
  }

  copyToClipboard(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      if (this.copiedTimers[key]) clearTimeout(this.copiedTimers[key]);
      this.setState({ copied: key });
      this.copiedTimers[key] = setTimeout(() => {
        this.setState(prev => prev.copied === key ? { copied: null } : {});
        delete this.copiedTimers[key];
      }, 1500);
    });
  }

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  render() {
    const books = this.filteredBooks();
    const e = React.createElement;

    return e('div', { className: 'admin-books-list' },

      // Search bar
      e('div', { className: 'admin-books-search-wrap' },
        e('svg', { className: 'admin-books-search-icon', viewBox: '0 0 20 20', fill: 'currentColor', width: 18, height: 18 },
          e('path', { fillRule: 'evenodd', d: 'M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z', clipRule: 'evenodd' })
        ),
        e('input', {
          className: 'admin-books-search',
          type: 'text',
          placeholder: 'Search books...',
          value: this.state.search,
          onChange: (ev) => this.setState({ search: ev.target.value })
        })
      ),

      // Book list
      books.length === 0
        ? e('div', { className: 'admin-books-empty' }, 'No books found')
        : e('div', { className: 'admin-books-cards' },
            books.map(book =>
              e('div', { className: 'admin-book-card', key: book.id },

                // Info section
                e('div', { className: 'admin-book-info' },
                  e('div', { className: 'admin-book-name' }, book.name),
                  e('div', { className: 'admin-book-meta' },
                    book.song_count + ' song' + (book.song_count !== 1 ? 's' : ''),
                    ' \u00B7 ' + (book.sync_to_all ? 'All devices' : (book.downloads || 0) + ' install' + ((book.downloads || 0) !== 1 ? 's' : '')),
                    ' \u00B7 Created ' + this.formatDate(book.created_at),
                    book.sync_to_all
                      ? e(React.Fragment, null,
                          ' \u00B7 ',
                          e('span', { className: 'admin-book-system-badge' }, 'System')
                        )
                      : null
                  )
                ),

                // Actions
                e('div', { className: 'admin-book-actions' },

                  // Share button
                  e('button', {
                    className: 'admin-book-btn',
                    onClick: () => this.copyToClipboard(this.shareUrl(book), 'share-' + book.id)
                  },
                    e('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 16, height: 16 },
                      e('path', { d: 'M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z' })
                    ),
                    'Share'
                  ),
                  this.state.copied === 'share-' + book.id
                    ? e('span', { className: 'admin-book-copied' }, 'Copied!')
                    : null,

                  // Edit share button
                  book.edit_token
                    ? e(React.Fragment, null,
                        e('button', {
                          className: 'admin-book-btn',
                          onClick: () => this.copyToClipboard(this.shareEditUrl(book), 'edit-' + book.id)
                        },
                          e('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 16, height: 16 },
                            e('path', { fillRule: 'evenodd', d: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z', clipRule: 'evenodd' })
                          ),
                          'Edit Link'
                        ),
                        this.state.copied === 'edit-' + book.id
                          ? e('span', { className: 'admin-book-copied' }, 'Copied!')
                          : null
                      )
                    : null,

                  // Manage link
                  e('a', {
                    className: 'admin-book-btn',
                    href: '/books/' + book.id + '/edit'
                  },
                    e('svg', { viewBox: '0 0 20 20', fill: 'currentColor', width: 16, height: 16 },
                      e('path', { d: 'M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z' })
                    ),
                    'Manage'
                  )
                )
              )
            )
          )
    );
  }
}
