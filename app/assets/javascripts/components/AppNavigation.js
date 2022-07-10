class AppNavigation {
  constructor(app) {
    this.app = app;
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
    window.history.replaceState({ page: this.app.state.page, currentBook: this.app.state.currentBook }, "", window.location.pathname);
  }

  toPreviousPageInHistory(e) {
    console.log(e.state);
    if (e.state.page) {
      e.preventDefault(); // stop request to server for new html
      e.stopPropagation();
      this.app.setState({ page: e.state.page, currentBook: e.state.currentBook });
      window.scrollTo(0, 0);
    }
  }

  returnToIndex() {
    this.app.setState({ page: "index" });
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
    var songId = e.target.closest(".index_row").id;
    this.app.setState({ page: songId });
    window.history.pushState({ page: songId, currentBook: this.app.state.currentBook }, "", songId);
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
