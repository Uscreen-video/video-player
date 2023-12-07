import { dispatch, Types } from "../../state";
import { VideoContainer } from "./Video-container.component";
import { mapCueListToState } from '../../helpers/cue'


export const subtitlesController = (
  host: VideoContainer,
  video: HTMLVideoElement,
  defaultTextTrack?: string
) => {
  // const command = createCommand(host)
  let activeTextTrack  = defaultTextTrack

  const trackElements = Array.from(video.querySelectorAll('track'))

  trackElements[0].track

  let tracksState: TextTrack[] = trackElements.map(t => t.track)
  // const cdnTracksMapping = trackElements.reduce<Record<string, string>>((acc, t) => {
  //   acc[t.srclang] = t.src
  //   return acc
  // }, {})

  const onCueChange = (event: Event & { target: TextTrack }) => {
    const targetLang = event.target.language || event.target.label
    if (targetLang === activeTextTrack) {
      const cues = mapCueListToState(event.target.activeCues)
      console.log('UPD CUES', targetLang, cues)
      dispatch(host, Types.Action.cues, { cues })
    }
  }

  // const enableTextTrack = (lang: string) => {
  //   textTracks().forEach((t) => {
  //     const tLang = t.language || t.label
  //     /**
  //      * We should hide all tracks to make default cue hidden 
  //      */

  //       t.mode = lang === tLang ? 'showing' : 'hidden'
  //   })
  // }

  dispatch(host, Types.Action.update, {
    textTracks: trackElements.map(t => ({
      src: t.src, //t.kind === 'metadata' ? cdnTracksMapping[t.language] : '',
      lang: t.srclang,
      label: t.label
    }))
  })

  tracksState.forEach(t => {
    t.mode = 'hidden'
    t.oncuechange = onCueChange
  })

  // const onTextTrackAdded = (data: TrackEvent) => {
  //   /**
  //    * If there is non metadata text track (e.g. included in m3u8 manifest)
  //    * We should skip metadata tracks (uploaded on CDN)
  //    */
  //   console.log('TEXT TRACK ADDED', data.track.label)
  //   data.track.mode = 'hidden'
  //   dispatch(host, Types.Action.update, {
  //     textTracks: textTracks().map(t => ({
  //       src: t.kind === 'metadata' ? cdnTracksMapping[t.language] : '',
  //       lang: t.language || t.label,
  //       label: t.label
  //     }))
  //   })

  //   textTracks().forEach(track => {
  //     track.oncuechange = onCueChange
  //   })

  //   enableTextTrack(activeTextTrack)
  // }

  // video.textTracks.addEventListener('addtrack', onTextTrackAdded)

  return {
    enableTextTrack: (lang: string) => {
      activeTextTrack = lang
      // enableTextTrack(lang)
      // dispatch(host, Types.Action.selectTextTrack, { activeTextTrack: lang })
      const activeTrack = tracksState.find(t => (t.language || t.label) === activeTextTrack)
      if (activeTrack?.activeCues) {
        dispatch(host, Types.Action.cues, { cues: mapCueListToState(activeTrack.activeCues) })
      }
    }
  }
}

export type SubtitlesController = ReturnType<typeof subtitlesController>
