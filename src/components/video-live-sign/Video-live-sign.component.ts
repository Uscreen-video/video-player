import { unsafeCSS, LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './Video-live-sign.styles.css?inline'

@customElement('video-live-sign')
export class VideoLiveSign extends LitElement {
  static styles = unsafeCSS(styles)

  render() {
    return html`
      <div class="sign" part="sign"></div>
      <slot>Live</slot>
    `
  }
}
