import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import styles from './Video-controls.styles.css?inline'
import { connect, listen } from '../../state'

/**
 * @slot - Video-controls main content
 * */
@customElement('video-controls')
export class VideoControls extends LitElement {
  static styles = unsafeCSS(styles)

  @connect('value')
  @state()
  state: number

  @listen('play')
  handlePlay() {
    console.log('here')
  }

  render() {
    console.log('[video-controls] updated', this.state)
    return html`
      <div>time is: ${this.state}</div>
      <slot></slot>
    `
  }
}
