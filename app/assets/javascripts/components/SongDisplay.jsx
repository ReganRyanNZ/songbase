const keys = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"];
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
const capoRegex = /.*Capo (\d+).*/;

function mod(n, m) {
  return ((n % m) + m) % m;
}

class SongDisplay extends React.Component {
  constructor(props) {
    super(props);

    var keyFromChordRegex = /\[([A-G]b*#*).*?\]/gm;
    var keyMatch = props.lyrics.match(keyFromChordRegex);
    var key = keyMatch ? keyMatch[0].replace(keyFromChordRegex, "$1") : "C";
    console.log("key: " + key);
    var transpose = props.transpose || 0;

    this.state = {
      showChords: true,
      transpose: transpose,
      key: key
    };

    this.transpose = this.transpose.bind(this);
    this.transposeControls = this.transposeControls.bind(this);
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
    if(capoRegex.test(this.props.lyrics)) {
      var presetTranspose = this.props.lyrics.match(capoRegex)[1];
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
    console.log(key + step);
    this.setState({
      transpose: key + step
    });
  }

  transpose(chord) {
    // whatever index a chord has in its original key, it'll have that index in the new key

    if (this.state.transpose == 0) {
      return chord;
    }

    var ogKey = this.state.key;
    var newKey = keys[mod((keys.indexOf(ogKey) + this.state.transpose), 12)];
    var chordCoreRegex = /([A-G]#?b?)([^A-G]*)/g;

    return chord.replace(chordCoreRegex, (match, chordCore, trailingChars) => {
      return scales[newKey][scales[ogKey].indexOf(chordCore)] + trailingChars
    })
  }

  getLyricsHTML() {
    safetyRegex = /.*[<>`].*/;
    lyrics = this.props.lyrics;

    if (safetyRegex.test(lyrics)) {
      return "ERROR: HTML tags are forbidden. Please do not use '<', '>', or backticks.";
    }

    var verseNumberRegex = /(^|\n)([0-9]+)\n/gm, // numbers by themselves on a line are verse numbers
      hasChordsRegex = /.*\[.*\].*/, // has square brackets
      chordsRegex = /\[(.*?)\]/g, // anything inside square brackets
      chordWordsRegex = /([^\>\s]*\[[^\]]*?\][^\s<]*)/g, // a word with a chord in it
      commentRegex = /^\# ?(.*)/, // everything after a '#'
      chorusRegex = /(\n|^)((  .*(?:\n|$))+)/g, // block with two spaces at the front of each line is a chorus
      lineRegex = /(.*\>)?( *)(.*)/,
      boldTextRegex = /\*\*(.+?)\*\*/g,
      italicTextRegex = /\*(.+?)\*/g;

    // get rid of sketchy invisable unicode chars
    lyrics = lyrics.replace(/[\r\u2028\u2029]/g, "");

    // parse verse numbers
    lyrics = lyrics.replace(verseNumberRegex, function($0, $1, $2) {
      return (
        $1 +
        "<div class='verse-number' data-uncopyable-text='" +
        $2 +
        "'></div>"
      );
    });

    // replace double-spaced lines with chorus tags
    lyrics = lyrics.replace(chorusRegex, `$1<div class='chorus'>$2</div>`);
    var lines = lyrics.split("\n"),
      maxIndex = lines.length;

    for (var i = 0; i < maxIndex; i++) {
      // style comments
      if (commentRegex.test(lines[i])) {

        lines[i] = lines[i].replace(
          commentRegex,
          "<div class='comment'>$1</div>"
        );

        // turn capo note into a handy button
        if (capoRegex.test(lines[i])) {
          lines[i] = lines[i].replace(capoRegex, (a, b) => this.transposeControls(b));
        }
      } else {
        // wrap each non comment line in a div
        // lines contain spans for text and chords, text is vert aligned to the bottom.
        // Chords have 0 width and double height, so everything aligns well.
        lines[i] = lines[i].replace(
          lineRegex,
          "$1$2<div class='line'><span class='line-text'>$3</span></div>"
        );
      }

      // parse chords
      // words containing chords are in a chord-word span, so that if the line is too long,
      // the text wrapping doesn't split on the chord (chopping the word in half)
      if (hasChordsRegex.test(lines[i])) {
        if (this.state.showChords) {
          lines[i] = lines[i].replace(
            chordWordsRegex,
            "<span class='chord-word'>$1</span>"
          );
          lines[i] = lines[i].replace(chordsRegex, (match, chord) => {
            return (
              "<span class='chord' data-uncopyable-text='" +
              this.transpose(chord) +
              "'></span>"
            );
          });
        }
      }
      // convert _ to musical tie for spanish songs
      lines[i] = lines[i].replace(/_/g, "<span class='musical-tie'>‿</span>");
    }

    // set capo controls
    if (/\[/.test(lyrics) && !capoRegex.test(lyrics)) {
      lines.unshift(this.transposeControls(null));
    }

    var text = lines.join("\n");
    text = text.replace(boldTextRegex, "<b>$1</b>");
    text = text.replace(italicTextRegex, "<i>$1</i>");
    return text;
  }

  transposeControls(capo) {
    var capoRecommended = !!capo ? `<div id='transpose-preset'>Capo ${capo}</div>` : ''

    return `<div class='transpose-comment'>
      <div class='transpose-controls'>
        <a id='transpose-down' class='transpose-symbol'>-</a>
        <div class='transpose-value'>${this.state.transpose}</div>
        <a id='transpose-up' class='transpose-symbol'>+</a>
      </div>
      ${capoRecommended}
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
