// Night/Normal theme toggle for the admin header. Reuses the same theme
// mechanism as the app: localStorage['cssTheme'] + window.setTheme (defined in
// the application layout), and the same .theme-toggle markup as UserSettings.
class ThemeToggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isNight: (localStorage.getItem('cssTheme') || 'css-normal') === 'css-night' };
    this.toggle = this.toggle.bind(this);
  }

  toggle(e) {
    var theme = e.target.checked ? 'css-night' : 'css-normal';
    window.setTheme(theme);
    this.setState({ isNight: e.target.checked });
  }

  render() {
    return (
      <label className="theme-toggle" title="Toggle night mode" aria-label="Toggle night mode">
        <input type="checkbox" checked={this.state.isNight} onChange={this.toggle} />
        <span className="toggle-track"></span>
      </label>
    );
  }
}
