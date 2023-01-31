import { ReactiveController, ReactiveElement } from "lit";
import { dispatch, Types } from "../state";

export class VideoEventsController implements ReactiveController {
  constructor(
    protected host: ReactiveElement
  ) {
    this.host.addController(this)
  }

  hostConnected(): void {

  }
  
  dispatch(action: Types.Action, params?: unknown) {
    dispatch(this.host, action, params)
  }

  dispatchEvent(type: string, video: HTMLVideoElement) {
    switch (type) {
      case 'play':
        this.dispatch(Types.Action.play)
        break
      case 'pause':
        this.dispatch(Types.Action.pause)
        break
      case 'timeupdate':
        this.dispatch(Types.Action.updateTime, {
          currentTime: video.currentTime
        })
        break
      case 'volumechange':
        this.dispatch(Types.Action.volumeChange, {
          value: video.volume,
          isMuted: video.muted
        })
        break
      case 'loadeddata':
        this.dispatch(Types.Action.updateDuration, {
          duration: video.duration
        })
    }
  }
}
