const UserSettings = ({
  settings,
  resetCache,
  cachedSongCount,
  setSettings,
  loadingData,
  homeButton
}) => {
  let toggleLanguage = (e) => {
    let newSettings = settings;
    let lang = e.target.value;

    if (newSettings.languages.includes(lang)) {
      newSettings.languages = newSettings.languages.filter(l => l !== lang);
    } else {
      newSettings.languages.push(lang);
    }
    setSettings(newSettings);
  }
  let updateTheme = (e) => {
    let newSettings = settings;
    newSettings.cssTheme = e.target.value;
    setSettings(newSettings);
  }
  let titleCase = (str) => str[0].toUpperCase() + str.slice(1)
  let createLangCheckbox = (lang) => (
    <label key={lang[0]}>
      <input
        name={lang[0]}
        type="checkbox"
        onChange={toggleLanguage}
        defaultChecked={settings.languages.includes(lang[0])}
        value={lang[0]}
      />
      <span className="lang-label">
        {titleCase(lang[0])} <span className="lang-count">({lang[1]})</span>
      </span>
    </label>
  )
  let sortedLangs = settings.languagesInfo.sort((a,b) => titleCase(a[0]) >= titleCase(b[0]) ? 1 : -1)
  let langCheckboxes = sortedLangs.map(createLangCheckbox);

  let isNight = settings.cssTheme === 'css-night';

  return (
    <div className="settings-container">
      {homeButton}

      <div className="settings-section">
        <h2>
          Languages
          {loadingData ? <span className="loading-spinner"></span> : null}
        </h2>
        <div className="lang-grid">
          {langCheckboxes}
        </div>
      </div>

      <div className="settings-section">
        <h2>Theme</h2>
        <div className="theme-toggle-row">
          <label className="theme-toggle">
            <input
              type="checkbox"
              checked={isNight}
              onChange={(e) => {
                updateTheme({ target: { value: e.target.checked ? 'css-night' : 'css-normal' } });
              }}
            />
            <span className="toggle-track"></span>
          </label>
          <span className="theme-label">{isNight ? 'Night' : 'Normal'}</span>
        </div>
      </div>

      <div className="settings-section reset-cache-section">
        <h2>Reset Cache</h2>
        <div className="reset-cache-info">
          If songs are not loading properly, you can reset the cache and download them again.
        </div>
        <div className="reset-cache-row">
          <button type="button" onClick={resetCache}>Reset cache</button>
          <span className="counter">Cached songs: {cachedSongCount}</span>
        </div>
      </div>

      <div className="settings-section install-section">
        <h2>Install App</h2>
        <p>First go to the website "songbase.life", from there:</p>
        <p><b>Safari on iOS</b><br />Share → Add to Homescreen</p>
        <p><b>Chrome on Android</b><br />Options → Install App</p>
      </div>

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
