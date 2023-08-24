class UserSettings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      settings: this.props.settings
    };

    this.toggleLanguage = this.toggleLanguage.bind(this);
    this.addLanguage = this.addLanguage.bind(this);
    this.removeLanguage = this.removeLanguage.bind(this);
    this.updateTheme = this.updateTheme.bind(this);
  }

  render() {
    var sortedLangs = this.props.settings.languagesInfo.sort((a,b) => a[0].toUpperCase() >= b[0].toUpperCase() ? 1 : -1);
    langCheckboxes = sortedLangs.map(lang => {
      var langName = lang[0],
        langCount = lang[1];
      return (
        <label key={lang[0]}>
          <input
            name={langName}
            type="checkbox"
            onChange={this.toggleLanguage}
            defaultChecked={this.state.settings.languages.includes(langName)}
            value={langName}
          />
          <div className="lang-label">
            {langName[0].toUpperCase() + langName.slice(1) + ` (${langCount})`}
          </div>
        </label>
      );
    });
    currentLanguagesForTesting = [
      <h2>Current Languages</h2>,
      <p>{this.state.settings.languages.toString()}</p>
    ];

    var themeRadioBtns = (
      <div className='radio-btns' onChange={this.updateTheme}>
        <div>
          <input type='radio' id='css-normal' name='theme' value='css-normal'/>
          <label htmlFor='css-normal' className='demo-css-normal app-settings-btn'>Normal</label>
        </div>
        <div>
          <input type='radio' id='css-night' name='theme' value='css-night'/>
          <label htmlFor='css-night' className='demo-css-night app-settings-btn'>Night</label>
        </div>
      </div>
    );

    var resetCacheBtn = (
      <div className="reset-cache-container">
        If songs are not loading properly, you can reset the cache and download them again:
        <button type='button' className="app-settings-btn" id='reset-cache' onClick={this.props.resetCache}>Reset cache</button>
        <div className="counter">Cached songs: {this.props.cachedSongCount}</div>
      </div>
    );

    return (
      <div className="settings-container">
        <div className="settings-btn" onClick={this.props.toggleSettingsPage}>
          <HomeIcon />
        </div>
        <h2>Languages</h2>
        {langCheckboxes}
        <h2>Theme</h2>
        {themeRadioBtns}
        <h2>Reset Cache</h2>
        {resetCacheBtn}
        <div className="contact-footer">
          <hr />
          Site Support:{" "}
          <a href="mailto:songbase.brothers@gmail.com">
            songbase.brothers@gmail.com
          </a>
        </div>
      </div>
    );
  }

  toggleLanguage(e) {
    var lang = e.target.value;
    if (this.state.settings.languages.includes(lang)) {
      this.removeLanguage(lang);
    } else {
      this.addLanguage(lang);
    }
  }

  addLanguage(lang) {
    settings = this.state.settings;
    if (!settings.languages.includes(lang)) {
      settings.languages.push(lang);
    }
    this.props.setSettings(settings);
  }

  removeLanguage(lang) {
    settings = this.state.settings;
    index = settings.languages.indexOf(lang);
    if (index > -1) {
      settings.languages.splice(index, 1);
    }
    this.props.setSettings(settings);
  }

  updateTheme(e) {
    var settings = this.state.settings;
    settings.cssTheme = e.target.value;
    this.props.setSettings(settings);
  }
}
