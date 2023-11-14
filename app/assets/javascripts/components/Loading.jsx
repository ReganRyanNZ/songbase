const Loading = ({ languagesLoaded }) => {
  const percentage = Math.floor((100/12) * languagesLoaded);
  const loadingText = `Loading songs: ${percentage}% done`;

  return (
    <div>{loadingText}</div>
  )
}
