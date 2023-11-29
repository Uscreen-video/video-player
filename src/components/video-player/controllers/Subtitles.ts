import { ReactiveController } from "lit";
import { dispatch, Types } from "../../../state";
import { VideoPlayer } from "../Video-player.component";
import { mapCueListToState } from '../../../helpers/cue'


export class SubtitlesController implements ReactiveController {
  video: HTMLVideoElement

  constructor(
    protected host: VideoPlayer & { fullscreenContainer: Element | string },
  ) {
    this.host.addController(this)
  }

  hostConnected(): void { 
    this.video = this.host.querySelector('video')
    this.video.textTracks.addEventListener('addtrack', this.onTextTrackAdded)
  }

  onTextTrackAdded = (data: TrackEvent) => {
    dispatch(this.host, Types.Action.update, {
      textTracks: this.textTracks
    })

    Array.from(this.video.textTracks).forEach(track => {
      track.oncuechange = this.onCueChange
    })

    this.video.textTracks[this.video.textTracks.length - 1].mode = 'showing'
    dispatch(this.host, Types.Action.selectTextTrack, {
      activeTextTrack: this.video.textTracks[this.video.textTracks.length - 1].label
    })
  }

  onCueChange = (event: Event & { target: TextTrack }) => {
    if (event.target.mode === 'showing') {
      dispatch(this.host, Types.Action.cues, { cues: mapCueListToState(event.target.activeCues) })
    }
  }

  get textTracks() {
    return Array.from(this.video.textTracks).map(t => ({
      src: '',
      lang: t.language || 'undefined',
      label: t.label
    }))
  }
}
