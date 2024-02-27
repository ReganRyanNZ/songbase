// Key thing here is the prop "bookRefs",
// Which is an array of [book_slug, book_name, book_index]

const LanguageLinks = ({
  linkIds,
  songs,
  setSong,
  hasBookRefsToo
}) => {
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

  if (!linkIds) { return "" }

  let links = linkIds.map((id) => {
    let song = songs.find(song => song.id == id)
    if (song == undefined) { return null }

    return (
      <div
        className="language_link song_link"
        id={song.id}
        key={song.id}
        onClick={setSong}
        language={song.lang}>
        {`${capitalize(song.lang)}: ${song.title}`}
      </div>
    )
  }).filter(nonNull => nonNull)

  // fancy line that sorts the links by language
  links.sort((a,b) => a.props.language < b.props.language ? -1 : (a.props.language > b.props.language ? 1 : 0))



  const linkList = (<div className={`lang-link-list ${(links.length > 0 && hasBookRefsToo) ? "with-line" : ""}`}>
                      {links}
                    </div>)

  return (
    <div className="lang-links">
      {linkList}
    </div>
  )
};
