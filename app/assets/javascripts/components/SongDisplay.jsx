class SongDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showChords: true
    };
  }

  getLyricsHTML() {
    safetyRegex = /.*[<>`].*/;
    lyrics = this.props.lyrics;

    if(safetyRegex.test(lyrics)) {
      return "ERROR: HTML tags are forbidden. Please do not use '<', '>', or backticks.";
    }

    var verseNumberRegex = /(^|\n)([0-9]+)\n/gm, // numbers by themselves on a line are verse numbers
        getVerseNumberRegex = /<div class='verse-number'.+<\/div>/, // gets inserted verse number div to strip from chord lines
        hasChordsRegex = /.*\[.*\].*/, // has square brackets
        chordsRegex = /\[(.*?)\]/g, // anything inside square brackets
        chordWordsRegex = /([^\>\s]*\[\S*?\]\S*)/g, // a word with a chord in it
        commentRegex = /^\# ?(.*)/, // everything after a '#'
        chorusRegex = /(\n|^)((  .*(?:\n|$))+)/g, // block with two spaces at the front of each line is a chorus
        lineRegex = /(.*\>)?( *)(.*)/;

    // parse verse numbers
    var verseNumber = 0,
    lyrics = lyrics.replace(verseNumberRegex, function($0, $1, $2) {
      return $1 + "<div class='verse-number' data-uncopyable-text='" + $2 + "'></div>"
    })

    // get rid of windows carriage returns
    lyrics = lyrics.replace(/\r\n/g, `\n`);

    // replace double-spaced lines with chorus tags
    lyrics = lyrics.replace(chorusRegex, `$1<div class='chorus'>$2\n</div>`)
    var lines = lyrics.split('\n'),
        maxIndex = lines.length;

    // parse each line
    for(var i=0; i < maxIndex; i++) {

      // style comments
      if(commentRegex.test(lines[i])) {
        lines[i] = lines[i].replace(commentRegex, "<div class='comment'>$1</div>");
      }
      // wrap each line in a div
      // lines contain spans for text and chords, text is vert aligned to the bottom.
      // Chords have 0 width and double height, so everything aligns well.
      lines[i] = lines[i].replace(lineRegex, "$1$2<div class='line'><span class='line-text'>$3</span></div>");

      // parse chords
      // words containing chords are in a chord-word span, so that if the line is too long,
      // the text wrapping doesn't split on the chord (chopping the word in half)
      if(hasChordsRegex.test(lines[i])) {
        if(this.state.showChords) {
          lines[i] = lines[i].replace(chordWordsRegex, "<span class='chord-word'>$1</span>")
          lines[i] = lines[i].replace(chordsRegex, "<span class='chord' data-uncopyable-text='$1'></span>")
        }
      }
      // convert _ to musical tie for spanish songs
      lines[i] = lines[i].replace(/_/g, "\u035c");
    }
    return (lines.join("\n"));
  }

  render() {
    return (
      <div
        className="lyrics"
        dangerouslySetInnerHTML={{__html: this.getLyricsHTML()}}
      />
    );
  }

}