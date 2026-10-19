# Reusable song search that behaves identically to the public index page
# (app/assets/javascripts/components/SongIndex.jsx): a "contains" match over
# normalized (stripped) title or lyrics, ranked into tiers — title-starts-with
# the query beats title-contains beats lyrics-only.
#
# The index page searches client-side in JavaScript (it's an offline PWA); this
# is the server-side equivalent used by the paste-a-list import resolver, which
# needs the full song DB the client may not have synced. The algorithm is a
# faithful port — see SongIndex.jsx#getSearchResults and #sortRowData.
#
# Tiers (higher is better):
#   2 = stripped title starts with the stripped query (prefix)
#   1 = stripped title contains the stripped query
#   0 = lyrics-only match
class SongSearcher
  # Faithful port of SongIndex.jsx#strip (lines 36-48). Built from explicit \u
  # code points so the source stays pure ASCII and the JS classes are matched
  # exactly: dashes _ - en(U+2013) em(U+2014) -> space; drop chords [...]; drop
  # ' (U+2019) ' (U+0027) " (U+0022) , (U+002C) left-curly " (U+201C) ! ? ( ) [ ];
  # drop combining diacriticals U+0300..U+036F.
  DASHES = Regexp.new("[_\\-\\u2013\\u2014]").freeze
  REMOVE = Regexp.new("\\[.+?\\]|[\\u2019\\u0027\\u0022\\u002C\\u201C!?()\\[\\]]|[\\u0300-\\u036F]").freeze

  # songs: an enumerable of Song records (uses title, lyrics, id, admin_entry).
  def initialize(songs)
    @songs = songs
    # Precompute stripped titles (short, cheap) for the fast per-query scan.
    @title_s = songs.to_h { |song| [song, strip(song.title, normalize: false)] }
  end

  # The index page's top-result decision for a single query line:
  #   [:unmatched, nil]
  #   [:matched, song]
  #   [:ambiguous, [song, ...]]  # two or more results tied at the top tier (<= 10)
  def resolve(query)
    ranked = search(query) # [[song, tier], ...] best-first, or []
    return [:unmatched, nil] if ranked.empty?

    top_tier = ranked.first.last
    top_group = ranked.select { |(_, tier)| tier == top_tier }.map(&:first)
    top_group.one? ? [:matched, top_group.first] : [:ambiguous, top_group.first(10)]
  end

  # Ranked songs for a query, best-first — the index page's result list.
  # Returns Song records in tier order; callers cap with .take(n).
  def rank(query)
    search(query).map(&:first)
  end

  private

  # Ranked matches for a query, best-first, as [[song, tier], ...].
  def search(query)
    q = strip(query, normalize: true)
    return [] if q.empty?

    esc      = Regexp.escape(q) # JS escapeRegExp; Regexp.escape is a safe superset
    contains = Regexp.new(esc, Regexp::IGNORECASE)
    starts   = Regexp.new("\\A#{esc}", Regexp::IGNORECASE)

    hits = []
    @title_s.each do |song, title_s|
      next unless contains.match?(title_s)
      hits << [song, starts.match?(title_s) ? 2 : 1, title_s]
    end

    # Lyrics matches are always tier 0, so they can never join the top tier when
    # any title match exists — only scan lyrics when there was no title hit.
    if hits.empty?
      lyrics_index.each do |song, lyrics_s|
        next unless contains.match?(lyrics_s)
        hits << [song, 0, @title_s[song]]
      end
    end

    hits.sort_by { |song, tier, title_s| [-tier, title_s, song.id] }
        .map { |song, tier, _| [song, tier] }
  end

  # Stripped lyrics for every song, built once and only when a query needs it.
  def lyrics_index
    @lyrics_index ||= @songs.to_h { |song| [song, strip(song.lyrics || "", normalize: false)] }
  end

  # NFD-normalize the query only (song data is already normalized); dashes to
  # space; uppercase; newline to space; drop chords/punctuation/combining marks.
  # Does not collapse or trim whitespace, matching the index page.
  def strip(str, normalize:)
    return "" if str.nil? || str.to_s.empty?

    s = normalize ? str.unicode_normalize(:nfd) : str.to_s
    s = s.gsub(DASHES, " ")
    s = s.upcase
    s = s.gsub(/\n/, " ")
    s.gsub(REMOVE, "")
  end
end
