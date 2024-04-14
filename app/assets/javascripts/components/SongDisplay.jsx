const keys = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"];
const guessingScaleSharps = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const guessingScaleFlats = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];
const scales = {
  A: ["A", "B", "C#", "D", "E", "F#", "G", "G#"],
  Bb: ["Bb", "C", "D", "Eb", "F", "G", "G#", "A"],
  B: ["B", "C#", "D#", "E", "F#", "G#", "A", "A#"],
  C: ["C", "D", "E", "F", "G", "A", "Bb", "B"],
  Db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "B", "C"],
  D: ["D", "E", "F#", "G", "A", "B", "C", "C#"],
  Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "Db", "D"],
  E: ["E", "F#", "G#", "A", "B", "C#", "D", "D#"],
  F: ["F", "G", "A", "Bb", "C", "D", "D#", "E"],
  Gb: ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "E", "F"],
  G: ["G", "A", "B", "C", "D", "E", "F", "F#"],
  Ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "Gb", "G"]
};
const keyCommonChords = {
  A: ["A", "Bm", "C#m", "D", "E", "F#m"],
  Bb: ["Bb", "Cm", "Dm", "Eb", "F", "Gm"],
  B: ["B", "C#m", "D#m", "E", "F#", "G#m"],
  C: ["C", "Dm", "Em", "F", "G", "Am"],
  Db: ["Db", "Ebm", "Fm", "Gb", "Ab", "Bbm"],
  D: ["D", "Em", "F#m", "G", "A", "Bm"],
  Eb: ["Eb", "Fm", "Gm", "Ab", "Bb", "Cm"],
  E: ["E", "F#m", "G#m", "A", "B", "C#m"],
  F: ["F", "Gm", "Am", "Bb", "C", "Dm"],
  Gb: ["Gb", "Abm", "Bbm", "Cb", "Db", "Ebm"],
  G: ["G", "Am", "Bm", "C", "D", "Em"],
  Ab: ["Ab", "Bbm", "Cm", "Db", "Eb", "Fm"]
}
// When transposing is going badly, we'll guess whether it's e.g. Ab or G#
// based on whether the key has flats or sharps in it. Keys like C with no
// natural sharps or flats, we are just wildly guessing.
const keySharpness = {A: 'sharp', Bb: 'flat', B: 'sharp', C: 'sharp', Db: 'flat', D: 'sharp', Eb: 'flat', E: 'sharp', F: 'flat', Gb: 'flat', G: 'sharp', Ab: 'flat'}

const regex = {
  capo: /.*capo (\d+).*/i,
  capoComment: /.*capo (\d+).*\n\n?/ig,
  tuneComment: /\#.*tune.*\n\n?/ig,
  comment: /^\# ?(.*)/, // everything after a '#'
  chordWords: /([^\>\s]*\[[^\]]*?\][^\s<]*)/g, // a word with a chord in it
  chords: /\[(.*?)\]/g, // anything inside square brackets
  choruses: /(\n|^)((  .*(?:\n|$))+)/g, // block with two spaces at the front of each line is a chorus
  stanzas: /(^|\n)(([^ #\n].*(\n|$))+)/g,
  hasChords: /.*\[.*\].*/, // has square brackets
  boldText: /\*\*(.+?)\*\*/g,
  italicText: /\*(.+?)\*/g,
  html_safety: /.*[<>`].*/,
  stanzaNumber: /^([0-9]+)$/, // numbers by themselves on a line are stanza numbers
  chordCore: /([A-G][b#]?)([^A-G]*)/g,
  emptyLine: /^$/,
  tagLine: /^(<[^>]+>)$/ // entire line is just a tag, eg "</div>"
};

function mod(n, m) {
  return ((n % m) + m) % m;
}

class SongDisplay extends React.Component {
  constructor(props) {
    super(props);

    window.song = this // For dev to have easy access :)

    let selectedTune = this.initializeTune() // get current tune from URL or preferred settings (and then update URL), default to 0

    this.state = {
      selectedTune: selectedTune,
      transpose: props.transpose || 0,
      originalKey: this.getKeyFromChords(this.lyrics(selectedTune)),
      logSongDisplay: false,
      showTuneSelectBox: false
    };

    // `bind` creates a new function with an immutable "this" reference. We
    // need to bind it here so we can reuse the one function instead of
    // creating many via event listener calls.
    this.goUpOneKey = this.goUpOneKey.bind(this);
    this.goDownOneKey = this.goDownOneKey.bind(this);
    this.toggleTransposePreset = this.toggleTransposePreset.bind(this);
    this.changeTune = this.changeTune.bind(this);
    this.toggleTuneSelector = this.toggleTuneSelector.bind(this);
    this.clickAwayFromTuneSelector = this.clickAwayFromTuneSelector.bind(this);

    this.setAnalyticsTimer();
  }
  componentDidMount() {
    this.addListeners();
  }
  componentDidUpdate() {
    this.addListeners();
  }

  log(str) {
    if (this.state.logSongDisplay) {
      console.log(str);
    }
  }

  initializeTune() {
    let tune = 0 // default
    if (this.lyricArray().length < 2) { return tune }

    // try path
    let pathMatch = window.location.search.match(/tune=(\d+)/)
    if (pathMatch) { tune = pathMatch[1] }
    else {
      // try cache
      let tuneCache = localStorage.getItem(window.location.pathname)
      if (tuneCache) { tune = tuneCache }
    }

    this.pushTuneToUrl(tune)
    return tune
  }

  // We don't want lyrics in the state, because the edit song form passes updated lyrics as props
  // So we need to get the current selected tune's lyrics dynamically from props
  lyrics(tune) {
    let lyricArray = this.lyricArray()
    selectedTune = tune === undefined ? this.state.selectedTune : tune

    // fix problems with lyrics updating to remove tunes
    if (selectedTune >= lyricArray.length) { this.changeTune(0); selectedTune = 0 }

    return this.removeTuneTitle(this.lyricArray()[selectedTune])
  }

  lyricArray() {
    if (this.props.lyrics == '') { return [''] }

    return this.props.lyrics.split(/(?=###)/)
                            .filter(s => s.length > 0)
  }

  removeTuneTitle(lyrics) {
    return lyrics.replace(/###.*\n/, "")
  }

  changeTune(tuneNumber) {
    if(tuneNumber.target) { tuneNumber = tuneNumber.target.dataset.tuneId }

    this.setState({selectedTune: tuneNumber,
                   transpose: 0,
                   originalKey: this.getKeyFromChords(this.lyrics(tuneNumber))})
    localStorage.setItem(window.location.pathname, tuneNumber)
    this.pushTuneToUrl(tuneNumber)
  }

  pushTuneToUrl(tuneNumber) {
    let tunePath = `?tune=${tuneNumber}`;
    window.history.replaceState(window.history.state, '', window.location.pathname+tunePath);
  }

  // StatCounter records pageviews, but only when app.html is first loaded,
  // because all navigation after that is intercepted for us to have offline
  // navigation. So we manually trigger a pageview here. However, to make the
  // analytics more useful, we don't log every song, only the ones that the
  // user stays on for a minimum length of time. This filters out a user
  // checking a song, realizing it's the wrong one, and exiting it.
  setAnalyticsTimer() {
    let longEnoughToCountAsSung = 20 * 1000;
    if (this.props.analyticsPath) {
      this.log(`"${this.props.title}" rendered with analytics prop`);
      let triggerPageView = (currentPath, title) => {
        if (window.location.href == currentPath) {
          this.log(`"${title}" still present after timer, logging to StatCounter`);
          _statcounter.record_pageview();
        } else {
          this.log(`"${title}" exited before timer, ignoring song for StatCounter analytics`);
        }
      }
      setTimeout(triggerPageView, longEnoughToCountAsSung, this.props.analyticsPath, this.props.title);
    }
  }

  // This react component is quite odd, it builds a bunch of html as a string
  // instead of a JSX element. This works fine for most things, but it's very
  // difficult to add click listeners inline. So here we have a method that
  // will be called after this component is mounted, adding the listener
  // functions on. Note that any function referenced may need to be bound to
  // the class (see the constructor method), so "this" can refer to the class
  // and not the event at the time of clicking.
  // Note also that this method will be called by react about 44 times. If the
  // listener function is named, that's fine because it wont add the same
  // reference twice. If the listener function is anonymous, then the reference
  // changes each time so you'll have your function called about 40 times per
  // click.
  addListeners() {
    if(this.chordsExist()) {
      let presetElements = document.getElementsByClassName("transpose-preset");
      if(presetElements) { [...presetElements].forEach((el) => el.addEventListener("click", this.toggleTransposePreset), this) }

      let tUpElement = document.getElementById("transpose-up")
      if(tUpElement) { tUpElement.addEventListener("click", this.goUpOneKey) }

      let tDownElement = document.getElementById("transpose-down")
      if(tDownElement) { tDownElement.addEventListener("click", this.goDownOneKey) }

      let toggleMusicElement = document.getElementById("show-music-controls");
      if(toggleMusicElement) { toggleMusicElement.addEventListener("click", this.props.toggleMusic) }
    }
    let shareButton = document.getElementById("share-song")
    if (shareButton) { shareButton.addEventListener("click", this.shareSong) }

    let tuneSelectorButton = document.querySelector(".tune-selector")
    if (tuneSelectorButton) { tuneSelectorButton.addEventListener("click", this.toggleTuneSelector) }

    let tuneSelect = document.querySelectorAll(".tune-select")
    tuneSelect.forEach(select => select.addEventListener("click", this.changeTune))

    // If the select is open, click anywhere to close it
    let tuneSelectBox = document.querySelector(".tune-select-box")
    if (tuneSelectBox) { document.body.addEventListener('click', this.clickAwayFromTuneSelector), {once : true} }
  }

  chordsExist() {
    return /\[/.test(this.lyrics());
  }

  getKeyFromChords(lyrics) {
    if(!lyrics) { return '' }
    let key;
    let songChordsRegex = /\[([A-G][b#]?m?).*?\]/g; // turns e.g. F#m9 into F#m, and gathers all chords from the song
    let songChords = Array.from(lyrics.matchAll(songChordsRegex), m => m[1]); // e.g. ['F#m', 'D', 'A', 'D']
    if(songChords.length > 0) {
      let lastChord = songChords.slice(-1).pop();
      if(songChords[0] == lastChord) { // Key is confirmed if song starts and ends with the same chord
        key = lastChord;

        // If the key is a minor, bump it by 3 to its relative major. This is a nifty workaround to handle minor keys, as e.g. D minor key uses the same notes as F major
        if(key.slice(-1)[0] == 'm') {
          let strippedKey = key.substr(0, key.length-1); // without 'm'
          key = keys[mod(keys.indexOf(strippedKey) + 3, 12)];
        }
      } else {
        let keysByChordCount = keys.map(k => songChords.filter(chord => keyCommonChords[k].includes(chord)).length);
        const bestMatch = Math.max(...keysByChordCount);
        key = keys[keysByChordCount.indexOf(bestMatch)]
      }
    }
    return key;
  }

  // if a song has "capo 2" in a comment, then clicking will toggle between capo 2 and 0
  toggleTransposePreset(e) {
    let presetTranspose = e.target.dataset.capo;
    if(presetTranspose) {
      let newTranspose = this.state.transpose != presetTranspose ? presetTranspose : 0;
      this.setState({transpose: parseInt(newTranspose)});
    }
  }


  goUpOneKey() { this.changeKey(1); }
  goDownOneKey() { this.changeKey(-1); }

  changeKey(step) {
    let key = parseInt(this.state.transpose);
    this.setState({
      transpose: key + step
    });
  }

  transposeChord(chord) {
    if (this.state.transpose == 0) {
      return chord;
    }

    let getNewKey = (ogKey, transposeValue) => keys[mod((keys.indexOf(ogKey) + transposeValue), 12)];
    let newKey = getNewKey(this.state.originalKey, this.state.transpose);

    return chord.replace(regex.chordCore, (_match, chordCore, trailingChars) => {
      let transposedCore;
      try { transposedCore = scales[newKey][scales[this.state.originalKey].indexOf(chordCore)] } catch(err) { transposedCore = false };
      if (transposedCore) {
        return transposedCore + trailingChars
      } else {
        // Fancy transposing failed, let's build this chord
        newKey = getNewKey(this.getKeyFromChords(this.lyrics()), this.state.transpose);
        let movement = mod(this.state.transpose, 12);
        let chordCoreIndex = Math.max(guessingScaleFlats.indexOf(chordCore), guessingScaleSharps.indexOf(chordCore));
        let newChordCoreIndex = mod(chordCoreIndex + movement, 12);
        let newChordCore = keySharpness[newKey] == 'sharp' ? guessingScaleSharps[newChordCoreIndex] : guessingScaleFlats[newChordCoreIndex];

        return newChordCore + trailingChars;
      }
    })
  }

  lyricsWithoutMusic(lyrics) {
    return lyrics.replace(regex.chords, '').replace(regex.capoComment, '').replace(regex.tuneComment, '')
  }

  getLyricsHTML() {
    let lyrics = this.lyrics();

    if (regex.html_safety.test(lyrics)) {
      return "ERROR: HTML tags are forbidden. Please do not use '<', '>', or backticks.";
    }

    let formatStanzas = (text) => text.replace(regex.stanzas, `$1<div class='stanza'>\n$2</div>\n`)
    let formatChorus = (text) => text.replace(regex.choruses, `$1<div class='chorus'>\n$2</div>\n`)
    let removeMusicFromLyrics = this.lyricsWithoutMusic
    let formatStanzaNumber = (line, nextLineHasChords) => `<div class='stanza-number ${nextLineHasChords ? "with-chords" : ""}' data-uncopyable-text='${line}'></div>`
    let formatCapoComment = (line) => line.replace(regex.capo, `<div class='transpose-preset comment' data-capo='$1'>Capo $1</div>`)
    let formatComment = (line) => line.replace(regex.comment, "<div class='comment'>$1</div>")
    let formatTextLine = (line) => `<div class='line'>${line}</div>`
    let formatChorusLine = (line) => line.replace(/^  /, "\t")
    let formatChordWord = (line) => line.replace(regex.chordWords, `<span class='chord-word'>$1</span>`) // words containing chords are in a chord-word span, so that if the line is too long, the text wrapping can move the whole word with chords
    let formatChords = (line, transpose) => formatChordWord(line).replace(regex.chords, (match, chord) => `<span class='chord' data-uncopyable-text='${transpose(chord)}'></span>`)
    let formatTextBoldItalic = (text) => text.replace(regex.boldText, "<b>$1</b>").replace(regex.italicText, "<i>$1</i>")
    let formatMusicalTies = (text) => text.replace(/_/g, "<span class='musical-tie'>‿</span>") // convert _ to musical tie for spanish songs
    let formatLyricLine = (line) => {
        line = formatChorusLine(line);
        line = formatTextLine(line);
        if (regex.hasChords.test(line) && this.props.showChords) {
          line = formatChords(line, this.transposeChord.bind(this));
        }
        return line;
    }
    let formatLine = (line, i, lines) => {
      if (regex.capo.test(line)) {
        return formatCapoComment(line)
      } else if (regex.comment.test(line)) {
        return formatComment(line)
      } else if (regex.stanzaNumber.test(line)) {
        return formatStanzaNumber(line, regex.hasChords.test(lines[i+1]))
      } else if (regex.tagLine.test(line)) {
        return line
      } else if (regex.emptyLine.test(line)) {
        return "<br>"
      } else {
        return formatLyricLine(line)
      }
    }

    lyrics = formatStanzas(lyrics);
    lyrics = formatChorus(lyrics);
    if (!this.props.showChords) { lyrics = removeMusicFromLyrics(lyrics) }
    lyrics = lyrics.split("\n")
                   .map(formatLine)
                   .join("\n")
    lyrics = formatTextBoldItalic(lyrics)
    lyrics = formatMusicalTies(lyrics)

    // Add controls, but hack in a <br> spacer if the tune selector control is present
    let controls = this.controls()
    if (controls.includes("tune-selector") && !lyrics.match(/^<br>/)) {
      lyrics = "<br>" + lyrics
    }
    lyrics = controls + lyrics
    return lyrics
  }

  shareSong() {
    if(navigator.share) {
      navigator.share({
        text: document.title,
        url: location.href
      })
    } else {
      navigator.clipboard.writeText(`${document.title}\n\n${location.href}`)
      let successMsg = document.getElementById("share-song-success")
      successMsg.classList.add("fadeOut")
      setTimeout( () => {successMsg.classList.remove("fadeOut")}, 1200);
    }
  }

  toggleTuneSelector() {
    this.setState({showTuneSelectBox: !this.state.showTuneSelectBox})
  }

  clickAwayFromTuneSelector(e) {
    if (!document.querySelector(".tune-select-box")) { return }
    if (e.target.closest(".tune-select-box")) { return }
    if (e.target.closest(".tune-selector")) { return }

    this.toggleTuneSelector()
    return;
  }

  controls() {
    let showChords = this.props.showChords;
    let transpose = this.state.transpose;

    let shareButton = () => {
      return(`<div class='share-song' id='share-song'>
                <div class='share-song-success' id='share-song-success'>Copied!</div>
                ${ShareIcon}
              </div>\n`)
    }
    let toggleMusicControl = () => {
      if(!this.chordsExist() || this.props.editMode) { return '' }

      return(`<div class='show-music-controls' id='show-music-controls'>
              ${ToggleMusicIcon}
             </div>\n`)
    }
    let transposeControls = () => {
      if(!this.chordsExist() || !showChords) { return '' }

      return `
        <div class='transpose-controls'>
          <button id='transpose-up' class='transpose-symbol'>${PlusIcon}</button>
          <div class='transpose-value'>${transpose}</div>
          <button id='transpose-down' class='transpose-symbol'>${MinusIcon}</button>
        </div>\n`;
    }

    let showTuneSelector = () => {
      // First calculate whether we have multiple tunes to show
      let lyricArray = this.lyricArray()
      if(lyricArray.length < 2) { return false }

      // If user is not seeing chords, don't show tune selector if all the
      // tunes have the exact same musicless content
      if (!this.props.showChords) {
        let regexToCompareLyrics = /[\s,\.'"?!;:\-–—‘’“”]/g
        let musiclessLyricArray = lyricArray.map(x => {
          x = this.removeTuneTitle(x)
          x = this.lyricsWithoutMusic(x)
          return x.replace(regexToCompareLyrics, "")
        })

        let removedDuplicates = [...new Set(musiclessLyricArray)]
        if(removedDuplicates.length < 2) { return false }
      }

      return true
    }

    let tuneSelector = () => {
      if (!showTuneSelector()) { return "" }
      let lyricArray = this.lyricArray()

      let tuneTitles = lyricArray.map((tune, i) => {
        let title = tune.match(/### (.*)/)
        title = title ? title[1] : 'Tune 1' // default in case there is no ### at the start of the first tune
        return title
      })

      let tuneSelects = tuneTitles.map((title, i) => {
        let check = ""
        if (this.state.selectedTune == i) {
          check = `<span class='selected-tune-check'>✓</span>`
        }

        return `<div class='tune-select' data-tune-id=${i}>${check}${title}</div>`
      }).join("")

      let selectBox = this.state.showTuneSelectBox ? `<div class='tune-select-box'>${tuneSelects}</div>` : ''

      return `<div class='tune-selector'>
                ${HamburgerMenu}
                <span>${tuneTitles[this.state.selectedTune]}</span>
                ${selectBox}
              </div>`
    }


    return `
      <div class='song-controls'>
        <div class='bookmark'>
          ${BookmarkIconAsString}
        </div>
        ${toggleMusicControl()}
        ${shareButton()}
        ${transposeControls()}
        ${tuneSelector()}
      </div>\n
    `
  }

  render() {
    return (
      <div
        className="lyrics"
        dangerouslySetInnerHTML={{ __html: this.getLyricsHTML() }}
      />
    );
  }
}
