import { connect } from '../../state'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './Video-controls.styles.css?inline'
import { classMap } from 'lit/directives/class-map.js';

/**
 * @slot - Video-controls main content
 * */
@customElement('video-controls')
export class VideoControls extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: Boolean, reflect: true })
  @connect('idle')
  idle: boolean

  @connect('isPlaying')
  isPlaying: boolean

  render() {
    return html`
      <slot></slot>
    `
  }
}
