class KabobMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
    this.toggleMenu = this.toggleMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside(e) {
    if (this.state.isOpen && !this.container.contains(e.target)) {
      this.closeMenu();
    }
  }

  toggleMenu(e) {
    e.stopPropagation();
    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
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
    const { canEdit, editUrl, showTrash } = this.props;

    if (!showTrash && !canEdit) {
      return null;
    }

    return (
      <div className="kabob-container" ref={el => this.container = el}>
        <button className="kabob-button" onClick={this.toggleMenu}>
          <KabobIcon />
        </button>
        {this.state.isOpen && (
          <div className="kabob-menu">
            {showTrash && (
              <a href="#" className="kabob-menu-item" onClick={this.handleRemove}>
                <TrashIcon />
                Remove from device
              </a>
            )}
            {canEdit && editUrl && (
              <a href={editUrl} className="kabob-menu-item" onClick={this.closeMenu}>
                <EditIcon />
                Edit book
              </a>
            )}
          </div>
        )}
      </div>
    );
  }
}
