const BookButton = props => {
  return(
    <div title="Books" className="book-icon" onClick={props.toggleBookIndex}>
      <div className="book-icon-marker">
      </div>
    </div>
  )
}