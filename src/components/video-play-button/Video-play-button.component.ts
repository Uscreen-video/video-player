import { unsafeCSS, LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './Video-play-button.styles.css?inline'
import { connect, createCommand, dispatch, Types } from '../../state'
import { Action, Event } from '../../types'

import '../button'

/**
 * @slot - Video-play-button main content
 * */
@customElement('video-play-button')
export class VideoPlayButton extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @connect('isPlaying')
  isPlaying: boolean

  @connect('isMuted')
  isMuted: boolean

  @connect('isFullscreen')
  isFullscreen: boolean

  @connect('activeTextTrack')
  activeTrack: string

  handleClick() {
    this.command(
      this.isPlaying
        ? Types.Command.pause
        : Types.Command.play
    )
  }

  handleFullscreen() {
    this.command(Types.Command.toggleFullscreen)
  }

  handleEnableCaptions() {
    this.command(Types.Command.enableTextTrack, {
      lang: this.activeTrack ? '' : 'en'
    })
  }

  render() {
    return html`
      <video-button @click=${this.handleClick}>
        Click me to ${this.isPlaying ? 'stop' : 'play'} the video
        <span slot="tooltip">
          ${this.isPlaying ? 'Pause' : 'Play'}
        </span>
      </video-button>
      <button @click=${this.handleFullscreen}>
        isFullscreen: ${this.isFullscreen ? 'true' : 'false'}
      </button>
      <button @click=${this.handleEnableCaptions}>
        activeTrack: ${this.activeTrack}
      </button>
    `
  }
}
