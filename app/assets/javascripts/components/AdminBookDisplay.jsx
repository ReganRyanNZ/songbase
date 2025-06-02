class AdminSongDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songs: props.songs || [],
      book: props.book || {},
    };
  }
  render() {
  const book = this.state.book;

  // Sort songs array by their reference in the book (songRef)
  const sortedSongs = this.state.songs.slice().sort((a, b) => {
    const refA = book && book.songs && book.songs[a.id] ? book.songs[a.id] : Infinity;
    const refB = book && book.songs && book.songs[b.id] ? book.songs[b.id] : Infinity;
    return refA - refB;
  });

  let list = sortedSongs.map((song) => {
    let editRef = "/songs/" + song.id + "/edit";
    let songRef = book && book.songs && book.songs[song.id] ? book.songs[song.id] : "-";

    return (
      <tr key={song.id}>
       <td>
          #{songRef}
          &nbsp;&nbsp;
        </td>
        <td>
          <a href={editRef}>{song.title}</a>
        </td>
        <td>
          <div className="last_edited">{song.last_editor}</div>
        </td>
        <td>
          <div className="edit_timestamp">{song.edit_timestamp}</div>
        </td>
      </tr>
    );
  });

  return (
    <div className="admin_list">
      <table className="admin_table">
        <tbody>{list}</tbody>
      </table>
    </div>
  );
}

}
