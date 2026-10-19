// Night/Normal theme toggle for the admin header. Shown as a single icon
// button: a sun in normal mode, a moon in night mode — so its purpose is
// obvious at a glance (the old bare switch only had a hover tooltip).
// Reuses the app's theme mechanism: localStorage['cssTheme'] + window.setTheme
// (defined in the application layout).
class ThemeToggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isNight: (localStorage.getItem('cssTheme') || 'css-normal') === 'css-night' };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    var theme = this.state.isNight ? 'css-normal' : 'css-night';
    window.setTheme(theme);
    this.setState({ isNight: !this.state.isNight });
  }

  render() {
    var isNight = this.state.isNight;
    return (
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={this.toggle}
        aria-pressed={isNight}
        aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
        title={isNight ? 'Switch to day mode' : 'Switch to night mode'}
      >
        {isNight ? <MoonIcon /> : <SunIcon />}
      </button>
    );
  }
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <line x1="12" y1="2.5" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="21.5" y2="12" />
      <line x1="5.3" y1="5.3" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="18.7" y2="18.7" />
      <line x1="5.3" y1="18.7" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="18.7" y2="5.3" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  );
}
