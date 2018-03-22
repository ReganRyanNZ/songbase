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




    // countable verse regex pseudo code:
    // if its the start of the lyrics OR if theres a gap of two new lines
    // after any amount of comments or new lines
    // get the character that's not weird (not the start of a comment or '{')

    var countableVerseRegex = /(^(?:\n*)|(?:\n\n))((?:(?:{ ?[Cc]omments?|#).*(?:\n)+)*)([^{#\n\s])/g,
        getVerseNumberRegex = /<div class='verse-number'.+<\/div>/, // gets inserted verse number div to strip from chord lines
        hasChordsRegex = /.*\[.*\].*/, // has square brackets
        getChordRegex = /\[(.*?)\]/g, // anything inside square brackets
        spacerTextRegex = /(^|\])([^\[]+)([\[\n])/g, // 3 groups, before spacer text (start of line or ']'), spacer text, and after spacer text (new line or '[')
        chordlessTailRegex = /\][^\[\]]+$/, // the last ']' in a string and everything after it
        commentRegex = /^\# *(.*)/, // everything after a '# '
        isChorusStartRegex = /{start_of_chorus}/i,
        isChorusEndRegex = /{end_of_chorus}/i,
        chorusRegex = /((?:(?:\n|^)  .*)+)/g, // block with two spaces at the front of each line
        isNoNumberRegex = /{no_number}/i;

    var verseNumber = 0,
        verseCount = (lyrics.match(countableVerseRegex) || '').length;

    if (verseCount > 2) {
      lyrics = lyrics.replace(countableVerseRegex, function($0, $1, $2, $3) {
        verseNumber++;
        return $1 + ($2 || "") + "<div class='verse-number' data-uncopyable-text='" + verseNumber + "'></div>" + $3
      })
    }
    lyrics = lyrics.replace(/\r\n/g, `\n`); // get rid of windows carriage returns

    lyrics = lyrics.replace(chorusRegex, `\n<div class='chorus'> $1 \n</div>`)

    var lines = lyrics.split('\n'),
        maxIndex = lines.length;

    for(var i=0; i < maxIndex; i++) {
      // remove no number comment
      // note this must remain the first regex of this loop, as it shifts the index
      if(isNoNumberRegex.test(lines[i])) {
        lines.splice(i, 1);
        maxIndex -= 1;
      }

      // style comments
      if(commentRegex.test(lines[i])) {
        lines[i] = lines[i].replace(commentRegex, "<span class='comment'>$1</span>");
      }
      // change chorus tags to html tags (for old chorus system)
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
          // strip chord line of verse number
          chordLine = chordLine.replace(getVerseNumberRegex, "");
          // format chord line
            //deletes chars to get the chords in the right place
          chordLine = this.positionChords(chordLine);
            // makes the spacer text unselectable/uncopyable
          chordLine = chordLine.replace(spacerTextRegex, "$1<span class='spacer-text' data-uncopyable-text='$2'></span>$3");
            // makes the chords formatted
          chordLine = chordLine.replace(getChordRegex, "<span class='chord'>$1</span>")
          // add formatted chord line to lyrics
          lines.splice(i, 0, chordLine);
          i += 1;
          maxIndex += 1;
        }
        //remove chords from original line
        lines[i] = lines[i].replace(getChordRegex, "");
      }
      lines[i] = lines[i].replace(/_/g, "\u035c");
    }
    return (lines.join("\n"));
  }

  // This method returns the line with chars taken out,
  // so when chords are inserted they aren't misplaced
  //
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