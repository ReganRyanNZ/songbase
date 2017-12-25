class UserSettings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      settings: this.getSettings()
    }

    this.toggleLanguage = this.toggleLanguage.bind(this);
    this.addLanguage = this.addLanguage.bind(this);
    this.removeLanguage = this.removeLanguage.bind(this);
    this.getSettings = this.getSettings.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
  }

  render() {
    return (
      <div className="settings-container">
        <label htmlFor="lang">Language</label>
        <input
          name="lang"
          type="checkbox"
          onClick={() => { this.toggleLanguage('english')} }
          defaultChecked={this.state.settings.languages.includes('english')}
        />
        <h2>Current Lanugages</h2>
        <p>{this.state.settings.languages.toString()}</p>
      </div>
    );
  }

  toggleLanguage(lang) {
    if(this.state.settings.languages.includes(lang)) {
      this.removeLanguage(lang);
    } else {
      this.addLanguage(lang);
    }
  }

  addLanguage(lang) {
    settings = this.state.settings;
    if(!settings.languages.includes(lang)) {
      settings.languages.push(lang);
    }
    this.saveSettings(settings);
  }

  removeLanguage(lang) {
    settings = this.state.settings;
    index = settings.languages.indexOf(lang);
    if(index > -1) {
      settings.languages.splice(index, 1);
    }
    this.saveSettings(settings);
  }

  saveSettings(settings) {
    document.cookie =  "settings=" + JSON.stringify(settings) +  "; expires=Sat, 1 Jan 2050 12:00:00 UTC; path=/";
    this.setState({settings: settings});
  }

  getSettings() {
    var cookies = decodeURIComponent(document.cookie).split(/; */);
    var target = 'settings='
    for(var i = 0; i <cookies.length; i++) {
        var c = cookies[i];
        if (c.indexOf(target) == 0) {
            return JSON.parse(c.substring(target.length, c.length));
        }
    }

    // default settings here
    return {
      languages: ["english"]
    };
  }
}