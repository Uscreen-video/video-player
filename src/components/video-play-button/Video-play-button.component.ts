import { unsafeCSS, LitElement, html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './Video-play-button.styles.css?inline'
import { connect } from '../../state'
import { emit } from '../../state/emitter'
import { Commander } from '../../state/commander'

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
    this.commander.command('play')
    // emit(this, 'click').then(() => console.log('click resolved'))
  }

  render() {
    return html`
      <button @click=${this.handleClick}>
        Click me to ${this.isPlaying ? 'stop' : 'play'} the video
      </button>
    `
  }
}
