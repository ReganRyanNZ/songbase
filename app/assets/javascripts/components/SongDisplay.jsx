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
  comment: /^\# ?(.*)/, // everything after a '#'
  chordWords: /([^\>\s]*\[[^\]]*?\][^\s<]*)/g, // a word with a chord in it
  chords: /\[(.*?)\]/g, // anything inside square brackets
  chorus: /(\n|^)((  .*(?:\n|$))+)/g, // block with two spaces at the front of each line is a chorus
  hasChords: /.*\[.*\].*/, // has square brackets
  boldText: /\*\*(.+?)\*\*/g,
  italicText: /\*(.+?)\*/g,
  html_safety: /.*[<>`].*/,
  verseNumber: /(^|\n)([0-9]+)\n/gm, // numbers by themselves on a line are verse numbers
  chordCore: /([A-G][b#]?)([^A-G]*)/g,
  invisableUnicodeCharacters: /[\r\u2028\u2029]/g
};

function mod(n, m) {
  return ((n % m) + m) % m;
}

class SongDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showChords: true,
      transpose: props.transpose || 0,
      originalKey: this.getKeyFromChords(props.lyrics)
    };

    this.transpose = this.transpose.bind(this);
    this.transposeControls = this.transposeControls.bind(this);
    this.controls = this.controls.bind(this);
    this.formatVerseNumbers = this.formatVerseNumbers.bind(this);
    this.formatChorus = this.formatChorus.bind(this);
    this.formatChords = this.formatChords.bind(this);
    this.formatComment = this.formatComment.bind(this);
    this.formatTextLine = this.formatTextLine.bind(this);
    this.changeKey = this.changeKey.bind(this);
    this.goUpOneKey = this.goUpOneKey.bind(this);
    this.goDownOneKey = this.goDownOneKey.bind(this);
    this.toggleTransposePreset = this.toggleTransposePreset.bind(this);
    this.addTransposeListeners = this.addTransposeListeners.bind(this);
  }
  componentDidMount() {
    this.addTransposeListeners();
  }
  componentDidUpdate() {
    this.addTransposeListeners();
  }

  addTransposeListeners() {
    if(/\[/.test(this.props.lyrics)) {
      var presetElement = document.getElementById("transpose-preset")
      if(presetElement) {
        presetElement.addEventListener("click", this.toggleTransposePreset);
      }
      var tUpElement = document.getElementById("transpose-up")
      if(tUpElement) {
        tUpElement.addEventListener("click", this.goUpOneKey);
      }
      var tDownElement = document.getElementById("transpose-down")
      if(tDownElement) {
        tDownElement.addEventListener("click", this.goDownOneKey);
      }
    }
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
    if(regex.capo.test(this.props.lyrics)) {
      var presetTranspose = this.props.lyrics.match(regex.capo)[1];
      let newTranspose = this.state.transpose != presetTranspose ? presetTranspose : 0;
      this.setState({transpose: parseInt(newTranspose)});
    }
  }

  goUpOneKey() { this.changeKey(1); }
  goDownOneKey() { this.changeKey(-1); }

  changeKey(step) {
    var key = parseInt(this.state.transpose);
    this.setState({
      transpose: key + step
    });
  }

  transpose(chord) {
    if (this.state.transpose == 0) {
      return chord;
    }

    let newKey = keys[mod((keys.indexOf(this.state.originalKey) + this.state.transpose), 12)]; // move down the list of keys, by transpose number

    return chord.replace(regex.chordCore, (_match, chordCore, trailingChars) => {
      let transposedCore;
      try { transposedCore = scales[newKey][scales[this.state.originalKey].indexOf(chordCore)] } catch(err) { transposedCore = false };
      if (transposedCore) {
        return transposedCore + trailingChars
      } else {
        // Fancy transposing failed, let's build this chord
        let movement = mod(this.state.transpose, 12);
        let chordCoreIndex = Math.max(guessingScaleFlats.indexOf(chordCore), guessingScaleSharps.indexOf(chordCore));
        let newChordCoreIndex = mod(chordCoreIndex + movement, 12);
        let newChordCore = keySharpness[newKey] == 'sharp' ? guessingScaleSharps[newChordCoreIndex] : guessingScaleFlats[newChordCoreIndex];

        return newChordCore + trailingChars;
      }
    })
  }

  getLyricsHTML() {
    lyrics = this.props.lyrics;

    if (regex.html_safety.test(lyrics)) {
      return "ERROR: HTML tags are forbidden. Please do not use '<', '>', or backticks.";
    }

    lyrics = lyrics.replace(regex.invisableUnicodeCharacters, "");
    lyrics = this.formatVerseNumbers(lyrics);
    lyrics = this.formatChorus(lyrics);

    var lines = lyrics.split("\n");

    for (var i = 0; i < lines.length; i++) {
      if (regex.capo.test(lines[i])) {
        lines[i] = this.formatCapoComment(lines[i]);
      } else if (regex.comment.test(lines[i])) {
        lines[i] = this.formatComment(lines[i]);
      } else {
        lines[i] = this.formatTextLine(lines[i]);

        if (regex.hasChords.test(lines[i]) && this.state.showChords) {
          lines[i] = this.formatChords(lines[i]);
        }
      }
    }
    lines.unshift(this.controls());
    lyrics = lines.join("\n");
    lyrics = this.formatTextBoldItalic(lyrics);
    lyrics = this.formatMusicalTies(lyrics);
    return lyrics;
  }

  formatTextBoldItalic(text) {
    text = text.replace(regex.boldText, "<b>$1</b>");
    text = text.replace(regex.italicText, "<i>$1</i>");
    return text
  }

  formatMusicalTies(lyrics) {
    // convert _ to musical tie for spanish songs
    return lyrics.replace(/_/g, "<span class='musical-tie'>‿</span>");
  }

  formatVerseNumbers(lyrics) {
    return lyrics.replace(regex.verseNumber, `$1<div class='verse-number' data-uncopyable-text='$2'></div>`);
  }

  formatChorus(lyrics) {
    return lyrics.replace(regex.chorus, `$1<div class='chorus'>$2</div>`);
  }

  formatChords(line) {
    // words containing chords are in a chord-word span, so that if the line is too long,
    // the text wrapping can move the whole word with chords.
    var separatedIntoWords = line.replace(regex.chordWords, `<span class='chord-word'>$1</span>`);
    return separatedIntoWords.replace(regex.chords, (match, chord) => `<span class='chord' data-uncopyable-text='${this.transpose(chord)}'></span>`);
  }

  formatCapoComment(line) {
    return line.replace(regex.capo, `<div id='transpose-preset'>Capo $1</div>`);
  }

  formatComment(line) {
    return line.replace(regex.comment, "<div class='comment'>$1</div>");
  }

  formatTextLine(line) {
    // Chords have 0 width and double height, so they appear above the text.
    // Both chords and text are in the same "line" block so they are aligned.
    lineRegex = /(.*\>)?(  )?(.*)/;
    return line.replace(lineRegex, `$1<div class='line'><span class='line-text'>$3</span></div>`);
  }

  controls() {
    return `
      <div class='song-controls'>
        <div class='bookmark'>
          ${BookmarkIconAsString}
        </div>
        ${this.transposeControls()}
      </div>
    `
  }

  transposeControls() {
    var songHasChords = /\[/.test(lyrics);
    if(!songHasChords) {
      return '';
    }

    return `
      <div class='transpose-controls'>
        <a id='transpose-down' class='transpose-symbol'>-</a>
        <div class='transpose-value'>${this.state.transpose}</div>
        <a id='transpose-up' class='transpose-symbol'>+</a>
      </div>`;
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
