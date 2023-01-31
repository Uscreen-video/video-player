import { ReactiveController, ReactiveElement } from "lit";
import type { VideoPlayer } from "../components/video-player";
import { dispatch, Types } from "../state";

export class IdleController implements ReactiveController {
  timeout: number

  constructor(
    protected host: VideoPlayer
  ) {
    this.host.addController(this)
  }

  hostConnected(): void {
    this.host.addEventListener('touchstart', this.handleIteration, { passive: true })
    this.host.addEventListener('mousemove', this.handleIteration, { passive: true })
    this.host.addEventListener('mouseleave', this.handleIteration, { passive: true })
    this.startIdleTimeout()
  }

  hostDisconnected(): void {
    this.host.removeEventListener('touchstart', this.handleIteration)
    this.host.removeEventListener('mousemove', this.handleIteration)
    this.host.removeEventListener('mouseleave', this.handleIteration)
  }

  startIdleTimeout() {
    this.clearIdleTimeout()
    this.timeout = window.setTimeout(() => {
      if (this.host.idle) return
      this.host.idle = true
      dispatch(this.host, Types.Action.idle, { idle: true })
    }, this.host.idleTimeout)
  }

  clearIdleTimeout() {
    if (!this.timeout) return
    window.clearTimeout(this.timeout)
    this.timeout = null
  }

  handleIteration = () => {
    this.startIdleTimeout()
    if (!this.host.idle) return
    this.host.idle = false
    dispatch(this.host, Types.Action.idle, { idle: false })
  }
}
