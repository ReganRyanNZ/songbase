const BookButton = props => {
  var closeBtn = null;
  if(props.inBook) {
    closeBtn = (
      <div className="book-icon-close">
        <div className="book-icon-close-x1">
          <div className="book-icon-close-x2"/>
        </div>
      </div>
    );
  }

  return(
    <div className="book-icon" onClick={props.toggleBookIndex}>
      <div className="book-icon-marker">
        {closeBtn}
      </div>
    </div>
  )
}