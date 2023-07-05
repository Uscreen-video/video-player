export const getBufferedEnd = (video: HTMLVideoElement) => {
  const { buffered, currentTime } = video
  let match = 0
  let i = 0

  if (!buffered) return match

  while (!match && i < buffered.length) {
    const start = buffered.start(i)
    const end = buffered.end(i)

    i++
    if (end > currentTime && (currentTime > start || !currentTime)) {
      match = end
    }
  }
  
  return match
}
