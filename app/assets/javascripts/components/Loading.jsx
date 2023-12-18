const Loading = ({ languagesLoaded, totalLanguages }) => {
  const percentage = Math.floor((100/totalLanguages) * languagesLoaded);
  const loadingText = `Loading songs: ${percentage}% done`;

  return (
    <div>{loadingText}</div>
  )
}
