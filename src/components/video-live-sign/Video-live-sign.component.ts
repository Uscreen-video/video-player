import { unsafeCSS, LitElement, html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'
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
