// Syllable-based chord projection: copy chord placement from the first
// chorded stanza onto later stanzas that lack chords.
//
// Display-only helper — does not mutate saved lyrics.

var ChordProjection = (function () {
  var MIN_GAP_SYLLABLES = 1; // at least one syllable between chords
  var MIN_INDEX_DIFF = MIN_GAP_SYLLABLES + 1;

  var stanzaNumberRe = /^([0-9]+)$/;
  var commentRe = /^\#/;
  var chorusLineRe = /^  /;
  var chordRe = /\[(.*?)\]/g;

  // Hymnal elisions / contractions that should count as one syllable
  // even when a naive vowel-group count would say otherwise.
  var ONE_SYLLABLE_WORDS = {
    "heav'n": 1, heavn: 1, heaven: 2,
    "giv'n": 1, givn: 1,
    "tak'n": 1, takn: 1,
    "fall'n": 1, falln: 1,
    "ris'n": 1, risn: 1,
    "know'n": 1,
    "bless'd": 1, blessd: 1, // "blessed" left to vowel counting (often 2)
    "hallow'd": 2, hallowd: 2,
    "pow'r": 1, powr: 1, power: 1,
    "flow'r": 1, flowr: 1, flower: 1,
    "show'r": 1, showr: 1, shower: 1,
    "tow'r": 1, towr: 1, tower: 1,
    "o'er": 1, oer: 1,
    "e'er": 1, eer: 1,
    "ne'er": 1, neer: 1,
    "thro'": 1, thro: 1,
    "ev'ry": 2, evry: 2, every: 2,
    "sev'ral": 2, sevral: 2,
    "int'rest": 2, intrest: 2,
    "diff'rent": 2, diffrent: 2,
    "mem'ry": 2, memry: 2,
    "wand'ring": 2, wandring: 2,
    "ev'ning": 2, evning: 2,
    "spir't": 1, spirt: 1,
    "lab'rer": 2, labrer: 2,
    "fav'rite": 2, favrite: 2,
    "giveth": 2, loveth: 2, maketh: 2,
    the: 1, a: 1, an: 1, of: 1, to: 1, in: 1, on: 1, at: 1, by: 1,
    i: 1, o: 1, oh: 1
  };

  function stripChords(text) {
    return text.replace(chordRe, "");
  }

  function lineHasChords(line) {
    return /\[[^\]]*\]/.test(line);
  }

  function isLyricLine(line) {
    if (line === "") return false;
    if (stanzaNumberRe.test(line)) return false;
    if (commentRe.test(line)) return false;
    return true;
  }

  function isChorusLine(line) {
    return chorusLineRe.test(line);
  }

  // Build cleaned string (apostrophes removed) + map back to original indices.
  function withoutApostrophes(word) {
    var cleaned = "";
    var indexMap = [];
    for (var i = 0; i < word.length; i++) {
      if (word[i] === "'") continue;
      indexMap.push(i);
      cleaned += word[i];
    }
    return { cleaned: cleaned, indexMap: indexMap };
  }

  function vowelGroupStarts(cleaned) {
    var vowel = /[aeiouy]/i;
    var starts = [];
    var inVowel = false;
    for (var i = 0; i < cleaned.length; i++) {
      var isV = vowel.test(cleaned[i]);
      if (isV && !inVowel) {
        starts.push(i);
        inVowel = true;
      } else if (!isV) {
        inVowel = false;
      }
    }
    return starts;
  }

  // Adjust for silent trailing "e" (hope, same) but keep "le" endings (lit-tle).
  function applySilentE(cleaned, starts) {
    if (starts.length <= 1) return starts;
    if (!/[bcdfghjklmnpqrstvwxz]e$/i.test(cleaned)) return starts;
    if (/le$/i.test(cleaned) && cleaned.length > 2 && !/[aeiouy]le$/i.test(cleaned)) {
      return starts; // "ble" / "tle" etc. keep the syllable
    }
    var lastStart = starts[starts.length - 1];
    if (lastStart === cleaned.length - 1) {
      return starts.slice(0, -1);
    }
    return starts;
  }

  // Pull a consonant onset onto each non-first syllable (VCV → V-CV, "pre" stays together).
  function attachOnsets(cleaned, starts) {
    var vowel = /[aeiouy]/i;
    if (starts.length <= 1) return starts;
    var adjusted = starts.slice();
    for (var i = 1; i < adjusted.length; i++) {
      var s = adjusted[i];
      // Include one preceding consonant when pattern is vowel-consonant-vowel
      if (s > 0 && !vowel.test(cleaned[s - 1]) && (s === 1 || vowel.test(cleaned[s - 2]))) {
        s = s - 1;
      }
      // Include a second onset consonant for common clusters (pr, tr, cl, ...)
      if (s > adjusted[i - 1] + 1 && s > 0 && !vowel.test(cleaned[s - 1]) && vowel.test(cleaned[s])) {
        var prev = s - 1;
        if (prev > adjusted[i - 1] && !vowel.test(cleaned[prev])) {
          s = prev;
        }
      }
      adjusted[i] = Math.max(adjusted[i - 1] + 1, s);
    }
    return adjusted;
  }

  function forcedSyllableCount(word) {
    var key = word.toLowerCase();
    if (ONE_SYLLABLE_WORDS.hasOwnProperty(key)) return ONE_SYLLABLE_WORDS[key];
    var noApos = key.replace(/'/g, "");
    if (ONE_SYLLABLE_WORDS.hasOwnProperty(noApos)) return ONE_SYLLABLE_WORDS[noApos];
    // Generic hymnal elision: ends with 'n / 'd / 'r after a consonant cluster → usually 1–2
    if (/[a-z]+'[nrd]$/i.test(word) && word.replace(/'/g, "").length <= 6) {
      return 1;
    }
    return null;
  }

  // Character indices in `word` where each syllable begins (first is always 0).
  function syllableStartsInWord(word) {
    if (!word) return [0];

    var forced = forcedSyllableCount(word);
    var mapped = withoutApostrophes(word);
    var cleaned = mapped.cleaned;
    var indexMap = mapped.indexMap;

    if (!cleaned.length) return [0];

    var startsClean = vowelGroupStarts(cleaned);
    startsClean = applySilentE(cleaned, startsClean);
    if (startsClean.length === 0) startsClean = [0];
    startsClean = attachOnsets(cleaned, startsClean);

    if (forced !== null) {
      if (forced <= 1) return [0];
      // Re-space evenly across the word when dictionary overrides count
      var even = [];
      for (var s = 0; s < forced; s++) {
        even.push(Math.min(word.length - 1, Math.floor(s * word.length / forced)));
      }
      even[0] = 0;
      return uniqueSorted(even);
    }

    var starts = startsClean.map(function (ci) {
      return indexMap[ci] !== undefined ? indexMap[ci] : 0;
    });
    starts[0] = 0;
    return uniqueSorted(starts);
  }

  function uniqueSorted(arr) {
    return arr.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  }

  function tokenizeWords(plainLine) {
    var words = [];
    // Include straight and curly apostrophes used in hymnals
    var re = /[A-Za-z]+(?:['\u2019][A-Za-z]+)*/g;
    var m;
    while ((m = re.exec(plainLine)) !== null) {
      words.push({ word: m[0].replace(/\u2019/g, "'"), start: m.index, end: m.index + m[0].length });
    }
    return words;
  }

  function lineSyllables(plainLine) {
    var syllables = [];
    var words = tokenizeWords(plainLine);
    for (var w = 0; w < words.length; w++) {
      var wordInfo = words[w];
      var localStarts = syllableStartsInWord(wordInfo.word);
      for (var i = 0; i < localStarts.length; i++) {
        var absStart = wordInfo.start + localStarts[i];
        var absEnd = wordInfo.start + (i + 1 < localStarts.length ? localStarts[i + 1] : wordInfo.word.length);
        syllables.push({ absStart: absStart, absEnd: absEnd });
      }
    }
    return syllables;
  }

  function extractChords(line) {
    var chords = [];
    var plainPos = 0;
    var i = 0;
    while (i < line.length) {
      if (line[i] === "[") {
        var end = line.indexOf("]", i);
        if (end === -1) break;
        chords.push({ chord: line.slice(i + 1, end), plainPos: plainPos });
        i = end + 1;
      } else {
        plainPos++;
        i++;
      }
    }
    return chords;
  }

  function chordToSyllable(plainPos, syllables) {
    if (!syllables.length) return { index: 0, fraction: 0 };

    for (var i = 0; i < syllables.length; i++) {
      var syl = syllables[i];
      if (plainPos >= syl.absStart && plainPos < syl.absEnd) {
        var len = Math.max(1, syl.absEnd - syl.absStart);
        return { index: i, fraction: (plainPos - syl.absStart) / len };
      }
    }
    // In punctuation / spaces: snap to the next syllable, else previous
    for (var j = 0; j < syllables.length; j++) {
      if (plainPos <= syllables[j].absStart) {
        return { index: j, fraction: 0 };
      }
    }
    return { index: syllables.length - 1, fraction: 1 };
  }

  function buildLineTemplate(line) {
    var plain = stripChords(line);
    var syllables = lineSyllables(plain);
    var chords = extractChords(line);
    var placements = chords.map(function (c) {
      var at = chordToSyllable(c.plainPos, syllables);
      return { chord: c.chord, syllableIndex: at.index, fraction: at.fraction };
    });
    return {
      syllableCount: syllables.length,
      placements: placements
    };
  }

  /**
   * Work-inwards placement: pin outer chords first (proportionally), then
   * recursively place the interior into the remaining syllable range.
   * Enforces at least one syllable between neighboring chords when space allows.
   */
  function placeInwards(sourceIndices, sourceCount, targetCount, minDiff) {
    var n = sourceIndices.length;
    if (n === 0 || targetCount <= 0) return [];

    function proportion(srcIdx) {
      if (sourceCount <= 1) return 0;
      return Math.round(srcIdx * (targetCount - 1) / (sourceCount - 1));
    }

    var result = new Array(n);

    function fill(lo, hi, boundLo, boundHi) {
      if (lo > hi) return;
      if (boundHi < boundLo) {
        var mid = Math.max(0, Math.min(targetCount - 1, Math.floor((boundLo + boundHi) / 2)));
        for (var k = lo; k <= hi; k++) result[k] = mid;
        return;
      }

      if (lo === hi) {
        var pref = proportion(sourceIndices[lo]);
        result[lo] = Math.max(boundLo, Math.min(boundHi, pref));
        return;
      }

      var prefLo = proportion(sourceIndices[lo]);
      var prefHi = proportion(sourceIndices[hi]);
      result[lo] = Math.max(boundLo, Math.min(boundHi, prefLo));
      result[hi] = Math.max(boundLo, Math.min(boundHi, prefHi));

      var needed = minDiff * (hi - lo);
      if (result[hi] < result[lo] + needed) {
        result[lo] = boundLo;
        result[hi] = Math.min(boundHi, boundLo + needed);
        if (result[hi] - result[lo] < needed) {
          result[hi] = boundHi;
          result[lo] = Math.max(boundLo, boundHi - needed);
        }
      }

      if (result[lo] > result[hi]) {
        var m = Math.floor((boundLo + boundHi) / 2);
        result[lo] = m;
        result[hi] = m;
      }

      fill(lo + 1, hi - 1, result[lo] + minDiff, result[hi] - minDiff);
    }

    fill(0, n - 1, 0, targetCount - 1);

    // Last-resort: no two chords on the exact same syllable
    for (var i = 1; i < n; i++) {
      if (result[i] <= result[i - 1]) {
        result[i] = Math.min(targetCount - 1, result[i - 1] + 1);
      }
    }
    for (var j = n - 2; j >= 0; j--) {
      if (result[j] >= result[j + 1]) {
        result[j] = Math.max(0, result[j + 1] - 1);
      }
    }

    return result;
  }

  function applyTemplateToLine(template, targetLine) {
    if (!template || !template.placements.length) return targetLine;
    if (lineHasChords(targetLine)) return targetLine;

    var plain = stripChords(targetLine);
    var syllables = lineSyllables(plain);
    if (!syllables.length) return targetLine;

    var sourceIndices = template.placements.map(function (p) { return p.syllableIndex; });
    var sourceCount = Math.max(1, template.syllableCount);
    var targetCount = syllables.length;
    var countsMatch = sourceCount === targetCount;

    var mapped;
    if (countsMatch) {
      // Same meter: keep relative syllable indices (and mid-syllable fractions).
      // Do not force extra gaps — the source may place chords on neighboring syllables.
      mapped = sourceIndices.map(function (idx) {
        return Math.max(0, Math.min(targetCount - 1, idx));
      });
      // Still never stack two chords on the exact same syllable
      for (var c = 1; c < mapped.length; c++) {
        if (mapped[c] <= mapped[c - 1]) {
          mapped[c] = Math.min(targetCount - 1, mapped[c - 1] + 1);
        }
      }
    } else {
      // Different syllable counts: proportional map, work inwards, keep ≥1 syl gap
      mapped = placeInwards(sourceIndices, sourceCount, targetCount, MIN_INDEX_DIFF);
    }

    var inserts = [];
    for (var i = 0; i < template.placements.length; i++) {
      var sylIndex = mapped[i];
      if (sylIndex === undefined || sylIndex < 0 || sylIndex >= syllables.length) continue;
      var syl = syllables[sylIndex];
      var frac = countsMatch ? (template.placements[i].fraction || 0) : 0;
      var len = Math.max(1, syl.absEnd - syl.absStart);
      var charPos = syl.absStart + Math.round(frac * len);
      if (charPos >= syl.absEnd && frac < 1) charPos = syl.absStart;
      if (charPos > plain.length) charPos = plain.length;
      inserts.push({ charPos: charPos, chord: template.placements[i].chord, order: i });
    }

    // Insert from right to left so earlier positions stay valid
    inserts.sort(function (a, b) {
      if (b.charPos !== a.charPos) return b.charPos - a.charPos;
      return b.order - a.order;
    });

    var result = plain;
    for (var j = 0; j < inserts.length; j++) {
      var ins = inserts[j];
      result = result.slice(0, ins.charPos) + "[" + ins.chord + "]" + result.slice(ins.charPos);
    }
    return result;
  }

  /**
   * Split lyrics into blocks:
   *   { type: 'meta'|'verse'|'chorus', lines: [{raw, index}] }
   * Verse blocks include their stanza-number line when present.
   */
  function parseBlocks(lyrics) {
    var lines = lyrics.split("\n");
    var blocks = [];
    var current = null;

    function startBlock(type) {
      current = { type: type, lines: [] };
      blocks.push(current);
    }

    function ensure(type) {
      if (!current || current.type !== type) startBlock(type);
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (commentRe.test(line) || (line === "" && (!current || current.type === "meta"))) {
        ensure("meta");
        current.lines.push({ raw: line, index: i });
        continue;
      }

      if (stanzaNumberRe.test(line)) {
        startBlock("verse");
        current.lines.push({ raw: line, index: i });
        continue;
      }

      if (isChorusLine(line)) {
        ensure("chorus");
        current.lines.push({ raw: line, index: i });
        continue;
      }

      // Blank line inside a verse/chorus: keep with current block
      if (line === "") {
        if (!current) startBlock("meta");
        current.lines.push({ raw: line, index: i });
        // Blank line often separates verse from what follows — close verse/chorus
        if (current.type === "verse" || current.type === "chorus") {
          current = null;
        }
        continue;
      }

      // Regular lyric line
      if (!current || current.type === "meta" || current.type === "chorus") {
        startBlock("verse");
      }
      current.lines.push({ raw: line, index: i });
    }

    return { blocks: blocks, lines: lines };
  }

  function verseLyricEntries(block) {
    return block.lines.filter(function (entry) {
      return isLyricLine(entry.raw) && !isChorusLine(entry.raw);
    });
  }

  function verseHasChords(block) {
    return verseLyricEntries(block).some(function (e) { return lineHasChords(e.raw); });
  }

  function buildVerseTemplates(block) {
    return verseLyricEntries(block).map(function (e) {
      return buildLineTemplate(e.raw);
    });
  }

  function applyToFurtherStanzas(lyrics) {
    if (!lyrics || !lineHasChords(lyrics)) return lyrics;

    var parsed = parseBlocks(lyrics);
    var lines = parsed.lines.slice();
    var blocks = parsed.blocks;

    var templateBlock = null;
    for (var b = 0; b < blocks.length; b++) {
      if (blocks[b].type === "verse" && verseHasChords(blocks[b])) {
        templateBlock = blocks[b];
        break;
      }
    }
    if (!templateBlock) return lyrics;

    var templates = buildVerseTemplates(templateBlock);
    if (!templates.length || !templates.some(function (t) { return t.placements.length; })) {
      return lyrics;
    }

    var seenTemplate = false;
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (block === templateBlock) {
        seenTemplate = true;
        continue;
      }
      if (!seenTemplate) continue;
      if (block.type !== "verse") continue;
      if (verseHasChords(block)) continue; // already chorded — leave alone

      var targets = verseLyricEntries(block);
      for (var t = 0; t < targets.length; t++) {
        var template = templates[t] || templates[templates.length - 1];
        if (!template || !template.placements.length) continue;
        var newLine = applyTemplateToLine(template, targets[t].raw);
        lines[targets[t].index] = newLine;
      }
    }

    return lines.join("\n");
  }

  return {
    applyToFurtherStanzas: applyToFurtherStanzas,
    // exposed for console debugging
    _lineSyllables: lineSyllables,
    _buildLineTemplate: buildLineTemplate,
    _placeInwards: placeInwards,
    _applyTemplateToLine: applyTemplateToLine,
    _syllableStartsInWord: syllableStartsInWord
  };
})();
