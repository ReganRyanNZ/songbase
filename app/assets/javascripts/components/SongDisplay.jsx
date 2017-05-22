class SongDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showChords: true
    };
  }

  getLyricsHTML() {
    safetyRegex = /.*(<|>).*/;
    if(safetyRegex.test(this.props.lyrics)) {
      return "ERROR: HTML tags are forbidden. Please do not use '<' and '>'.";
    }





    var countableVerseRegex = /(^\n*|\n\n+)(({[Cc]omments?|#).*\n)*([^{# \n])/g,
        hasChordsRegex = /.*\[.*\].*/,
        getChordRegex = /\[(.*?)\]/g,
        chordlessTailRegex = /\][^\[\]]+$/,
        commentRegex = /^(\{ ?[Cc]omments?:|\#) *([^{}]*)}?/,
        isChorusStartRegex = /{start_of_chorus}/i,
        isChorusEndRegex = /{end_of_chorus}/i;

    var lyrics = this.props.lyrics,
        verseNumber = 0,
        verseCount = lyrics.match(countableVerseRegex).length;

    if (verseCount > 2) {
      lyrics = lyrics.replace(countableVerseRegex, function($0, $1, $2, $3, $4) {
        verseNumber++;
        return $1 + ($2 || "") + "<div class='verse-number'>" + verseNumber + "</div>" + $4
      })
    }
    var lines = lyrics.split('\n'),
        maxIndex = lines.length;

    for(var i=0; i < maxIndex; i++) {
      // style comments
      if(commentRegex.test(lines[i])) {
        lines[i] = lines[i].replace(commentRegex, "<span class='comment'>$2</span>");
      }
      // change chorus tags to html tags
      if(isChorusStartRegex.test(lines[i])) {
        lines[i] = "<div class='chorus'>"
      } else if(isChorusEndRegex.test(lines[i])) {
        lines[i] = "</div>"
      }

      // if a line has chords
      if(hasChordsRegex.test(lines[i])) {

        if(this.state.showChords) {
          var chordLine = lines[i];
          // strip chord line of trailing (no chord remaining) text
          chordLine = chordLine.replace(chordlessTailRegex, "]");
          // format chord line
          chordLine = this.positionChords(chordLine); //deletes chars to get the chords in the right place
          chordLine = "<span class='spacer-text'>" + chordLine + "</span>";
          chordLine = chordLine.replace(getChordRegex, "</span><span class='chord'>$1</span><span class='spacer-text'>")
          // add to lyrics
          lines.splice(i, 0, chordLine);
          i += 1;
          maxIndex += 1;
        }
        //remove chords from original line
        lines[i] = lines[i].replace(getChordRegex, "");
      }
    }
    return (lines.join("\n"));
  }


  // Chords are positioned within invisible duplicates of the line itself
  // Because the chords themselves take up space, when we add a chord
  // we take away some characters, to keep following chords in roughly
  // the right place.
  positionChords(line) {
    for(var i=0; i<line.length; i++) {
      if(line[i] === '[') {
        chordSize = 0;
        i += 1;
        // count size of chord
        while(line[i] != ']' && i < line.length) {
          i += 1;
          increase = line[i] === 'm' ? 2 : 1; // m's on avg take up 2 chars
          chordSize += increase;
        }
        i += 1; //i is now at the char after the chord

        // remove that many chars from after the chord
        // stopping if start of line or end of prev chord
        while(i < line.length && chordSize > 0 && line[i] != '[') {
          line = line.slice(0, i) + line.slice(i+1, line.length); //remove char before the '['
          chordSize -= 1;
        }
      }
    }
    return line;
  }

  render() {
    return (
      <div
        className="song-container"
        dangerouslySetInnerHTML={{__html: this.getLyricsHTML()}}>
      </div>
    );
  }

}