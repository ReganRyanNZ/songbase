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

class SongDisplay extends React.Component {
  constructor(props) {
    super(props);

    var keyFromChordRegex = /\[([A-G]b*#*).*?\]/gm;
    var keyMatch = props.lyrics.match(keyFromChordRegex);
    var key = keyMatch ? keyMatch[0].replace(keyFromChordRegex, "$1") : "C";
    console.log("key: " + key);

    this.state = {
      showChords: true,
      transpose: this.props.transpose || 0,
      key: key
    };

    this.transpose = this.transpose.bind(this);
    this.changeKey = this.changeKey.bind(this);
    this.addCapoListener = this.addCapoListener.bind(this);
  }
  componentDidMount() {
    this.addCapoListener();
  }
  componentDidUpdate() {
    this.addCapoListener();
  }

  addCapoListener() {
    var capo = document.getElementById("capo");
    if (capo) {
      capo.addEventListener("click", this.changeKey);
    }
  }

  changeKey(e) {
    transpose = parseInt(e.target.dataset["capo"]);
    if (transpose == this.state.transpose) {
      console.log("transposing to " + 0);
      this.setState({
        transpose: 0
      });
    } else {
      console.log("transposing to " + transpose);
      this.setState({
        transpose: transpose
      });
    }
  }

  transpose(chord) {
    // whatever index a chord has in its original key, it'll have that index in the new key

    if (this.state.transpose == 0) {
      return chord;
    }

    var chordCoreRegex = /([A-G]#?b?)(.*)/;
    var chordCoreMatch = chord.match(chordCoreRegex);

    if (!chordCoreMatch) {
      return chord;
    }

    var ogKey = this.state.key;
    var newKey = keys[(keys.indexOf(ogKey) + this.state.transpose) % 12];
    var chordCore = chordCoreMatch[1];
    var chordPosition = scales[ogKey].indexOf(chordCore);
    return chord.replace(chordCoreRegex, scales[newKey][chordPosition] + "$2");
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
      capoRegex = /([Cc]apo (\d+))/, // e.g. "Capo 3"
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

    // parse each line
    for (var i = 0; i < maxIndex; i++) {
      // style comments
      if (commentRegex.test(lines[i])) {
        lines[i] = lines[i].replace(
          commentRegex,
          "<div class='comment'>$1</div>"
        );

        // turn capo note into a handy button
        if (capoRegex.test(lines[i])) {
          lines[i] = lines[i].replace(
            capoRegex,
            "<span id='capo' class='capo' data-capo=$2>$1</span>"
          );
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
    var text = lines.join("\n");
    text = text.replace(boldTextRegex, "<b>$1</b>");
    text = text.replace(italicTextRegex, "<i>$1</i>");
    return text;
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
