import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
// import styles from './Video-player.styles.css?inline'

/**
 * @slot - Video-player main content
 * */
@customElement('ds-video-player')
export class VideoPlayer extends LitElement {
  // static styles = unsafeCSS(styles)


  render() {
    return html`
      <slot>i am a video-player</slot>
    `
  }
}
