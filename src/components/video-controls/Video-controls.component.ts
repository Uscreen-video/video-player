import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import styles from './Video-controls.styles.css?inline'
import { connect, dispatch, listen } from '../../state'
import { Action, Command, Event } from '../../state/types'

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
      <div>time is: ${this.state}</div>
      <slot></slot>
    `
  }
}
