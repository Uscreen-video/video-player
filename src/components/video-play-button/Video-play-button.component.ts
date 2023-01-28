import { unsafeCSS, LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './Video-play-button.styles.css?inline'
import { connect, dispatch } from '../../state'
import { Commander } from '../../state/commander'
import { Action, Command } from '../../state/types'

/**
 * @slot - Video-play-button main content
 * */
@customElement('video-play-button')
export class VideoPlayButton extends LitElement {
  static styles = unsafeCSS(styles)

  @connect('isPlaying')
  isPlaying = false

  commander = new Commander(this)

  handleClick() {
    this.commander.command(this.isPlaying ? Command.pause : Command.play)
  }

  render() {
    return html`
      <button @click=${this.handleClick}>
        Click me to ${this.isPlaying ? 'stop' : 'play'} the video
      </button>
    `
  }
}
