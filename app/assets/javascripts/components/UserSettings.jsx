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
  let createLangCheckbox = (lang) => {let langName = lang[0]
                                      let langCount = lang[1]
                                      return (<label key={lang[0]}>
                                                <input
                                                  name={langName}
                                                  type="checkbox"
                                                  onChange={toggleLanguage}
                                                  defaultChecked={settings.languages.includes(langName)}
                                                  value={langName}
                                                />
                                                <div className="lang-label">
                                                  {titleCase(langName) + ` (${langCount})`}
                                                </div>
                                              </label>)}
  let sortedLangs = settings.languagesInfo.sort((a,b) => titleCase(a[0]) >= titleCase(b[0]) ? 1 : -1)
  let langCheckboxes = sortedLangs.map(createLangCheckbox);

  let themeRadioBtns = (
    <div className='radio-btns' onChange={updateTheme}>
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

  let resetCacheBtn = (
    <div className="reset-cache-container">
      <div>If songs are not loading properly, you can reset the cache and download them again.</div>
      <button type='button' className="app-settings-btn" id='reset-cache' onClick={resetCache}>Reset cache</button>
      <div className="counter">Cached songs: {cachedSongCount}</div>
    </div>
  );

  let loadingSpinner = loadingData ? (<div className='loading-spinner'></div>) : ""

  return (
    <div className="settings-container">
      {homeButton}
      <h2>
        Languages
        {loadingSpinner}
      </h2>

      {langCheckboxes}
      <h2>Theme</h2>
      {themeRadioBtns}
      <h2>Reset Cache</h2>
      {resetCacheBtn}
      <h2>Install App</h2>
      <p>First go to the website "songbase.life", from there:</p>
      <p><b>Safari on iOS</b> <br/>Share {">"} Add to Homescreen</p>
      <p><b>Chrome on Android</b> <br/>Options  {">"} Install App</p>
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
