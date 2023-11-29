import { dispatch, Types, createCommand } from "../../state";
import { VideoContainer } from "./Video-container.component";
import { mapCueListToState } from '../../helpers/cue'


export const subtitlesController = (
  host: VideoContainer,
  video: HTMLVideoElement,
  defaultTextTrack?: string
) => {
  const command = createCommand(host)
  let activeTextTrack  = defaultTextTrack
  let hasNonMetaData = false

  const trackElements = Array.from(video.querySelectorAll('track'))
  const cdnTracksMapping = trackElements.reduce<Record<string, string>>((acc, t) => {
    acc[t.srclang] = t.src
    return acc
  }, {})

  const textTracks = (): TextTrack[] => {
    return Array.from(video.textTracks)
  }

  const onCueChange = (event: Event & { target: TextTrack }) => {
    console.log('CUE CHANGE!')
    if (event.target.mode === 'showing') {
      const targetLang = event.target.language || event.target.label
      if (targetLang !== activeTextTrack) {
        command(Types.Command.enableTextTrack, { lang: targetLang })
      }
      dispatch(host, Types.Action.cues, { cues: mapCueListToState(event.target.activeCues) })
    }
  }

  const enableTextTrack = (lang: string) => {
    textTracks().forEach((t) => {
      const tLang = t.language || t.label
      if (hasNonMetaData && t.kind === 'metadata') {
        t.mode = 'hidden'
      } else {
        t.mode = lang === tLang ? 'showing' : 'hidden'
      }
    })
  }

  const onTextTrackAdded = (data: TrackEvent) => {
    /**
     * If there is non metadata text track (e.g. included in m3u8 manifest)
     * We should skip metadata tracks (uploaded on CDN)
     */
    hasNonMetaData = data.track.kind !== 'metadata'
    dispatch(host, Types.Action.update, {
      textTracks: textTracks().filter(t => hasNonMetaData ? t.kind !== 'metadata' : true).map(t => ({
        src: t.kind === 'metadata' ? cdnTracksMapping[t.language] : '',
        lang: t.language || t.label,
        label: t.label
      }))
    })

    textTracks().forEach(track => {
      track.oncuechange = onCueChange
    })

    enableTextTrack(activeTextTrack)
  }

  video.textTracks.addEventListener('addtrack', onTextTrackAdded)

  return {
    enableTextTrack: (lang: string) => {
      activeTextTrack = lang
      enableTextTrack(lang)
      const activeTrack = textTracks().find(t => t.mode === 'showing')
      if (activeTrack?.activeCues) {
        dispatch(host, Types.Action.cues, { cues: mapCueListToState(activeTrack.activeCues) })
      }
    }
  }
}

export type SubtitlesController = ReturnType<typeof subtitlesController>
