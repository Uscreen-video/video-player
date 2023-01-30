import { unsafeCSS, LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './Video-play-button.styles.css?inline'
import { connect, createCommand, dispatch, Types } from '../../state'
import { Action, Event } from '../../state/types'

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

  handleClick() {
    this.command(
      this.isPlaying
        ? Types.Command.pause
        : Types.Command.play
    )
  }

  handleMutedState() {
    dispatch(this, Action.toggleMuted)
  }

  render() {
    return html`
      <button @click=${this.handleClick}>
        Click me to ${this.isPlaying ? 'stop' : 'play'} the video
      </button>
      <button @click=${this.handleMutedState}>
        isMuted: ${this.isMuted ? 'true' : 'false'}
      </button>
    `
  }
}
