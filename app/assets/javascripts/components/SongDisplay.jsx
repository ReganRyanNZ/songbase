const keys = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"];
const bestGuessScale = ["A", "Bb", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
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
  chordCore: /([A-G]#?b?)([^A-G]*)/g
};

function mod(n, m) {
  return ((n % m) + m) % m;
}

class SongDisplay extends React.Component {
  constructor(props) {
    super(props);

    var keyFromChordRegex = /\[([A-G]b*#*).*?\]/gm;
    var keyMatch = props.lyrics.match(keyFromChordRegex);
    var key = keyMatch ? keyMatch[0].replace(keyFromChordRegex, "$1") : "C";
    var transpose = props.transpose || 0;

    this.state = {
      showChords: true,
      transpose: transpose,
      key: key
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
    this.upHalfStep = this.upHalfStep.bind(this);
    this.downHalfStep = this.downHalfStep.bind(this);
    this.transposePresetKey = this.transposePresetKey.bind(this);
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
        presetElement.addEventListener("click", this.transposePresetKey);
      }
      var tUpElement = document.getElementById("transpose-up")
      if(tUpElement) {
        tUpElement.addEventListener("click", this.upHalfStep);
      }
      var tDownElement = document.getElementById("transpose-down")
      if(tDownElement) {
        tDownElement.addEventListener("click", this.downHalfStep);
      }
    }
  }

  transposePresetKey(e) {
    if(regex.capo.test(this.props.lyrics)) {
      var presetTranspose = this.props.lyrics.match(regex.capo)[1];
      var newTranspose = 0;
      if(this.state.transpose != presetTranspose) {
        newTranspose = presetTranspose;
      }
      this.setState({transpose: parseInt(newTranspose)});
    }
  }

  upHalfStep(e) {
    this.changeKey(1);
  }

  downHalfStep(e) {
    this.changeKey(-1);
  }

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

    var ogKey = this.state.key;
    var newKey = keys[mod((keys.indexOf(ogKey) + this.state.transpose), 12)];

    return chord.replace(regex.chordCore, (match, chordCore, trailingChars) => {
      // whatever the chord is for original scale, put that chord on the new scale
      // if the scale doesn't make sense, try the bestGuess™ scale
      return (
        scales[newKey][scales[ogKey].indexOf(chordCore)] ||
        bestGuessScale[(bestGuessScale.indexOf(chordCore)+this.state.transpose) % 12] ||
        '?'
      ) + trailingChars
    })
  }

  getLyricsHTML() {
    lyrics = this.props.lyrics;

    if (regex.html_safety.test(lyrics)) {
      return "ERROR: HTML tags are forbidden. Please do not use '<', '>', or backticks.";
    }

    lyrics = lyrics.replace(/[\r\u2028\u2029]/g, ""); // get rid of sketchy invisable unicode chars
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
