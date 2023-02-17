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

  @connect('idle')
  @property({ type: Boolean, reflect: true })
  idle: boolean

  @connect('isPlaying')
  @property({ type: Boolean, reflect: true })
  playing: boolean

  render() {
    return html`
      <slot></slot>
    `
  }
}
