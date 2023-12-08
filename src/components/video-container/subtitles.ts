import { dispatch, Types } from "../../state";
import { VideoContainer } from "./Video-container.component";
import { mapCueListToState } from '../../helpers/cue'


export const subtitlesController = (
  host: VideoContainer,
  video: HTMLVideoElement,
  defaultTextTrack?: string
) => {
  let activeTextTrack  = defaultTextTrack

  const trackElements = Array.from(video.querySelectorAll('track'))

  trackElements[0].track

  let tracksState: TextTrack[] = trackElements.map(t => t.track)

  const onCueChange = (event: Event & { target: TextTrack }) => {
    const targetLang = event.target.language || event.target.label
    if (targetLang === activeTextTrack) {
      const cues = mapCueListToState(event.target.activeCues)
      console.log('UPD CUES', targetLang, cues)
      dispatch(host, Types.Action.cues, { cues })
    }
  }

  dispatch(host, Types.Action.update, {
    textTracks: trackElements.map(t => ({
      src: t.src,
      lang: t.srclang,
      label: t.label
    }))
  })

  tracksState.forEach(t => {
    t.mode = 'hidden'
    t.oncuechange = onCueChange
  })

  const onTextTrackAdded = (data: TrackEvent) => {
    console.log('TRACK ADDED', data.track.label, data.track.kind, data.track.language)
    if (data.track.kind !== 'metadata') {
      tracksState = [
        ...tracksState.filter(t => t.kind !== 'metadata'),
        data.track
      ]
      dispatch(host, Types.Action.update, {
        textTracks: tracksState.map(t => ({
          src: '',
          lang: t.language || t.label,
          label: t.label
        }))
      })
      tracksState.forEach(t => {
        t.mode = 'hidden'
        t.oncuechange = onCueChange
      })
      trackElements.forEach(t => {
        t.track.mode = 'disabled'
      })
    }
  }

  video.textTracks.addEventListener('addtrack', onTextTrackAdded)

  return {
    enableTextTrack: (lang: string) => {
      activeTextTrack = lang
      const activeTrack = tracksState.find(t => (t.language || t.label) === activeTextTrack)
      if (activeTrack?.activeCues) {
        dispatch(host, Types.Action.cues, { cues: mapCueListToState(activeTrack.activeCues) })
      }
    }
  }
}

export type SubtitlesController = ReturnType<typeof subtitlesController>
