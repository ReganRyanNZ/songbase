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

  let helpTips = [
    {
      title: "Searching & filtering by language",
      body: "Use the search bar on the home page to find songs by number, title or lyrics. Tick languages above search multiple langauges"
    },
    {
      title: "Books — add, edit & share",
      body: "We have finished our books feature! You are now able to create, edit, and share your own books. The books are kept on your device until shared using the sharing links. Edit access can also be shared if there multiple people working on a songbook!"
    },
    {
      title: "Offline use & installing the app",
      body: "Songs are cached on your device, so Songbase works offline. Add it to your home screen (see Install App above) for a full-screen, app-like experience."
    },
    {
      title: "Printing a song (the /p shortcut)",
      body: "On any song, add /p to the end of the URL (e.g. songbase.life/123/p) to open a clean, printable view with the chord layout."
    }
  ]

  return (
    <div className="settings-container">
      {homeButton}

      <div className="settings-grid">
        <div className="settings-section">
          <h2>
            Languages
            {loadingData ? <span className="loading-spinner"></span> : null}
          </h2>
          <div className="lang-grid">
            {langCheckboxes}
          </div>
        </div>

        <div className="settings-side">
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

          <div className="settings-section reset-section">
            <h2>Reset cache</h2>
            <div className="reset-info">
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

          <div className="settings-section support-section">
            <h2>Site Support</h2>
            <p>
              Questions or issues? Email{" "}
              <a href="mailto:songbase.brothers@gmail.com">songbase.brothers@gmail.com</a>
            </p>
          </div>
        </div>
      </div>

      <div className="settings-section help-section">
        <h2>Help &amp; Tips</h2>
        {helpTips.map((tip, i) => (
          <details key={i}>
            <summary>{tip.title}</summary>
            <p>{tip.body}</p>
          </details>
        ))}
      </div>

    </div>
  );
}
