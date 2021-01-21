class SongPrint extends React.Component {
  constructor(props) {
    super(props);

    this.formatLyricsForPrint = this.formatLyricsForPrint.bind(this);
  }

  formatLyricsForPrint(lyrics) {
    var chordsRegex = /\[.*?\]/; // using .split() will remove everything within square brackets
    var everythingNotAChord = /(^|\])[^[]*\[?/g; // using replace() will remove everything not in square brackets
    lyrics = lyrics.replace(/(^|\n)  /g, "$1    "); // pad out choruses to 4 spaces
    var lines = lyrics.split("\n");

    for(i=0; i < lines.length; i++) {
      // line here is just the text without chords,
      // split by chords as the delimiter
      var line = lines[i].split(chordsRegex);

      if(line.length > 1) {
        var chords = lines[i].replace(everythingNotAChord, (match) => " ".repeat(match.length));
        var words = line.join('')

        // adds a line of chords before the words, needs to be flattened later
        lines[i] = [chords, words];
      }
    }
    return lines.flat().join('\n');
  }

  render() {
    return(
      <div className='song-print'>{this.formatLyricsForPrint(this.props.lyrics)}</div>
    )
  }
}