export const getCueText = (element: Node) => {
  const wrapper = document.createElement('div')
  wrapper.appendChild(element)
  return wrapper.innerHTML.split(/\n/gm)
}

export const mapCueListToState = (cueList: TextTrackCueList) => Array.from(cueList)
  .map((cue: VTTCue) => cue.getCueAsHTML())
  .flatMap(getCueText)