import { unsafeCSS, LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './Video-controls.styles.css?inline'
import { connect } from '../../state'

/**
 * @slot - Video-controls main content
 * */
@customElement('video-controls')
export class VideoControls extends LitElement {
  static styles = unsafeCSS(styles)

  @connect('value')
  state: number

  render() {
    return html`
      <div>counter is: ${this.state}</div>
      <slot></slot>
    `
  }
}
