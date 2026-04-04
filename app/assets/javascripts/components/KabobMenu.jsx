class KabobMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false, showCopied: false };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.closeOtherMenus = this.closeOtherMenus.bind(this);
    this.handleShare = this.handleShare.bind(this);
    this.handleShareEdit = this.handleShareEdit.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
    document.addEventListener('kabob:open', this.closeOtherMenus);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('kabob:open', this.closeOtherMenus);
  }

  handleClickOutside(e) {
    if (this.state.isOpen && !this.container.contains(e.target)) {
      this.closeMenu();
    }
  }

  closeOtherMenus(e) {
    if (e.target !== this.container && this.state.isOpen) {
      this.closeMenu();
    }
  }

  toggleMenu(e) {
    e.stopPropagation();
    var willOpen = !this.state.isOpen;
    this.setState({ isOpen: willOpen });

    if (willOpen) {
      // Dispatch event to close other kabob menus
      var event = new CustomEvent('kabob:open', { detail: { container: this.container } });
      document.dispatchEvent(event);
    }
  }

  closeMenu() {
    this.setState({ isOpen: false });
  }

  handleRemove(e) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Remove this book from your device?')) {
      this.props.onRemove();
      this.closeMenu();
    }
  }

  getEditToken() {
    // Check the actual book edit token from props (available for super admin)
    if (this.props.bookEditToken) return this.props.bookEditToken;
    // Fallback to parsing from editUrl
    if (!this.props.editUrl) return null;
    const match = this.props.editUrl.match(/edit_token=([^&]+)/);
    return match ? match[1] : null;
  }

  isMobile() {
    // Check for touch support and mobile user agent
    return 'ontouchstart' in window && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  shareUrl(url) {
    if (navigator.share && this.isMobile()) {
      navigator.share({
        text: 'Songbase book',
        url: url
      });
      this.closeMenu();
    } else {
      navigator.clipboard.writeText(url);
      this.setState({ showCopied: true });
      this.closeMenu();
      setTimeout(() => this.setState({ showCopied: false }), 1200);
    }
  }

  handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/?new_book=${this.props.bookId}`;
    this.shareUrl(url);
  }

  handleShareEdit(e) {
    e.preventDefault();
    e.stopPropagation();
    const token = this.getEditToken();
    const url = `${window.location.origin}/?new_book=${this.props.bookId}&edit_token=${token}`;
    this.shareUrl(url);
  }

  render() {
    var canEdit = this.props.canEdit;
    var editUrl = this.props.editUrl;
    var showTrash = this.props.showTrash;
    var hasShare = this.props.bookSlug;

    if (!showTrash && !canEdit && !hasShare) {
      return null;
    }

    return (
      <div className="kabob-container" ref={function(el) { this.container = el; }.bind(this)}>
        <button className="kabob-button" onClick={this.toggleMenu}>
          <KabobIcon />
        </button>
        {this.state.showCopied &&
          React.createElement("div", { className: "kabob-copied fadeOut" }, "Copied!")
        }
        {this.state.isOpen && (
          <div className="kabob-menu">
            {hasShare &&
              React.createElement("a", {
                href: "#",
                className: "kabob-menu-item",
                onClick: this.handleShare
              },
                React.createElement("span", { dangerouslySetInnerHTML: { __html: ShareIcon }, className: "kabob-icon" }),
                canEdit ? "Share (read-only)" : "Share"
              )
            }
            {canEdit && editUrl && this.getEditToken() &&
              React.createElement("a", {
                href: "#",
                className: "kabob-menu-item",
                onClick: this.handleShareEdit
              },
                React.createElement("span", { dangerouslySetInnerHTML: { __html: ShareIcon }, className: "kabob-icon" }),
                "Share (edit)"
              )
            }
            {canEdit && editUrl &&
              React.createElement("a", {
                href: editUrl,
                className: "kabob-menu-item",
                onClick: this.closeMenu
              },
                React.createElement(EditIcon),
                "Edit book"
              )
            }
            {showTrash &&
              React.createElement("a", {
                href: "#",
                className: "kabob-menu-item kabob-menu-item-trash",
                onClick: this.handleRemove
              },
                React.createElement(TrashIcon),
                "Remove from device"
              )
            }
          </div>
        )}
      </div>
    );
  }
}
