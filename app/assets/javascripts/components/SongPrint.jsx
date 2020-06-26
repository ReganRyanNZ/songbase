class SongPrint extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var lyrics = this.props.lyrics;
    var removeChordsSplitter = /\[.*?\]/; // using .split() will remove everything within square brackets
    var getChordsFilter = /(^|\])[^[]*\[?/g; // using replace() will remove everything not in square brackets
    lyrics = lyrics.replace(/(^|\n)  /g, "$1    "); // pad out choruses to 4 spaces
      var lines = lyrics.split("\n");
    for(i=0; i < lines.length; i++) {
      var line = lines[i].split(removeChordsSplitter);
      if(line.length > 1) {
        lines[i] = [lines[i].replace(getChordsFilter, '    '), line.join('')]
      }
    }

    return(
      <div className='song-print'>{lines.flat().join('\n')}</div>
    )
  }
}