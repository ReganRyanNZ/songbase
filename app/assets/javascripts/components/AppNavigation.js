class AppNavigation {
  constructor(app) {
    this.app = app;

    // All these bindings are important as navigation methods are used in other
    // components, and we want to always know for sure where "this" points to.
    this.setupInitialHistoryState = this.setupInitialHistoryState.bind(this);
    this.toPreviousPageInHistory = this.toPreviousPageInHistory.bind(this);
    this.returnToIndex = this.returnToIndex.bind(this);
    this.toggleSettingsPage = this.toggleSettingsPage.bind(this);
    this.toggleBookIndex = this.toggleBookIndex.bind(this);
    this.clearBook = this.clearBook.bind(this);
    this.setSong = this.setSong.bind(this);
    this.goToBookIndex = this.goToBookIndex.bind(this);
  }

  setupInitialHistoryState() {
    window.history.replaceState({ page: this.app.state.page, currentBook: this.app.state.currentBook }, "", window.location.pathname+window.location.search);
  }

  toPreviousPageInHistory(e) {
    if (e.state.page) {
      e.preventDefault(); // stop request to server for new html
      e.stopPropagation();
      this.app.setState({ page: e.state.page, currentBook: e.state.currentBook });
      window.scrollTo(0, 0);
    }
  }

  returnToIndex() {
    this.app.setState({ page: "index", rowLimit: 100 });
    let currentBook = this.app.state.currentBook;
    let path = !!currentBook ? `/${currentBook.slug}/i` : "/"
    window.history.pushState({ page: "index", currentBook: currentBook }, "", path);
  }

  toggleSettingsPage() {
    if (this.app.state.page == "settings") {
      this.returnToIndex();
    } else {
      this.app.setState({ page: "settings" });
      window.history.pushState({ page: "settings", currentBook: this.app.state.currentBook }, "", "/");
    }
  }

  toggleBookIndex() {
    if(this.app.state.currentBook) {
      return this.clearBook();
    }

    if (this.app.state.page == "books") {
      this.returnToIndex();
    } else {
      this.app.setState({ page: "books" });
      window.history.pushState({ page: "books", currentBook: this.app.state.currentBook }, "", "/books");
    }
  }

  clearBook() {
    this.app.setState({
      page: "index",
      currentBook: null,
      rowLimit: 100
    });
    window.history.pushState({ page: "index", currentBook: null }, "", "/");
    window.scrollTo(0, 0);
  }

  setSong(e) {
    let target = e.target.closest(".song_link")
    let songId = target.id
    let book, path
    if (target.classList.contains('language_link')) {
      book = null // if we're navigating via language links, we need to exit from any book
      path = `/${songId}`
    } else {
      book = this.app.state.currentBook
      path = songId
    }
    this.app.setState({ page: songId, currentBook: book });
    window.history.pushState({ page: songId, currentBook: book }, "", path);
    window.scrollTo(0, 0);
  }

  goToBookIndex(bookSlug) {
    var currentBook = this.app.state.books.find(book => book.slug === bookSlug);
    this.app.setState({
      page: "index",
      currentBook: currentBook
    });
    window.history.pushState({ page: "index", currentBook: currentBook }, "", `/${bookSlug}/i`);
    window.scrollTo(0, 0);
  }
}
