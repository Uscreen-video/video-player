import { connect } from '../../state'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './Video-controls.styles.css?inline'

/**
 * @slot - Video-controls main content
 * */
@customElement('video-controls')
export class VideoControls extends LitElement {
  static styles = unsafeCSS(styles)

  @connect('value')
  state = 0

  render() {
    return html`
      <div>counter is: ${this.state}</div>
      <slot></slot>
    `
  }
}
