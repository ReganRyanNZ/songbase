class KabobMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.closeOtherMenus = this.closeOtherMenus.bind(this);
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
    if (confirm('Remove this book from your device?')) {
      this.props.onRemove();
      this.closeMenu();
    }
  }

  render() {
    var canEdit = this.props.canEdit;
    var editUrl = this.props.editUrl;
    var showTrash = this.props.showTrash;

    if (!showTrash && !canEdit) {
      return null;
    }

    return (
      <div className="kabob-container" ref={function(el) { this.container = el; }.bind(this)}>
        <button className="kabob-button" onClick={this.toggleMenu}>
          <KabobIcon />
        </button>
        {this.state.isOpen && (
          <div className="kabob-menu">
            {showTrash &&
              React.createElement("a", {
                href: "#",
                className: "kabob-menu-item",
                onClick: this.handleRemove
              },
                React.createElement(TrashIcon),
                "Remove from device"
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
          </div>
        )}
      </div>
    );
  }
}
