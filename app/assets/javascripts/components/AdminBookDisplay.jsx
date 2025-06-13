class AdminBookDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      songs: props.songs || [],
      book: props.book || {},
    };
  }

  getSortedSongRows() {
    const { songs, book } = this.state;

    return [...songs]
      .sort((a, b) => {
        const aRef = book.songs[String(a.id)];
        const bRef = book.songs[String(b.id)];

        const aOrder = (aRef === undefined || aRef === null) ? Infinity : aRef;
        const bOrder = (bRef === undefined || bRef === null) ? Infinity : bRef;

        return aOrder - bOrder;
      })
      .map((song) => {
        let songRef = book.songs[String(song.id)];
        if (songRef === undefined || songRef === null) {
          songRef = "-";
        }

        const editUrl = `/songs/${song.id}/edit`;

        return (
          <tr key={song.id}>
            <td>#{songRef}&nbsp;&nbsp;</td>
            <td>
              <a href={editUrl}>{song.title}</a>
            </td>
            <td>
              <div className="last_edited">{song.last_editor || "N/A"}</div>
            </td>
          </tr>
        );
      });
  }

  render() {
    return (
      <div className="admin_list">
        <table className="admin_table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Last Edited By</th>
            </tr>
          </thead>
          <tbody>
            {this.getSortedSongRows()}
          </tbody>
        </table>
      </div>
    );
  }
}
