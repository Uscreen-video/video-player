import { ReactiveController } from "lit";
import { Types } from "../../../state";
import type { VideoPlayer } from "../Video-player.component";

const keys = [
  'space',
  'keym',
  'arrowup',
  'arrowdown',
  'enter',
  'arrowright',
  'arrowleft'
] as const

export class KeyboardController implements ReactiveController {
  timer: number
  callback: (value: boolean) => void

  constructor(
    private host: VideoPlayer
  ) {
    this.host.addController(this)
  }

  hostConnected(): void {
    this.host.addEventListener('keydown', this.handleKeydown)
    Promise.resolve().then(() => this.host.autofocus && this.host.focus())
  }

  command(command: Types.Command, props?: Record<string, unknown>) {
    this.host.command(command, props, { keyboard: true, once: true })
  }

  hostDisconnected(): void {
    this.host.addEventListener('keydown', this.handleKeydown)
  }

  handleKeydown(e: KeyboardEvent) {
    const code = (e.code.toLowerCase() as typeof keys[number])
    if (keys.includes(code)) e.preventDefault()
    else return
  
    switch (code) {
      case 'space':
        this.command(Types.Command.togglePlay)
        break
      case 'keym':
        this.command(Types.Command.toggleMuted)
        break
      case 'arrowup':
        this.command(Types.Command.increaseVolume)
        break
      case 'arrowdown':
        this.command(Types.Command.decreaseVolume)
        break
      case 'arrowright':
        this.command(Types.Command.forward)
        break
      case 'arrowleft':
        this.command(Types.Command.backward)
        break
      case 'enter':
        this.command(Types.Command.toggleFullscreen)
        break
    }
  }

}
