import { connect } from '../../state'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { DependentPropsMixin } from '../../mixins/DependentProps'
import styles from './Video-controls.styles.css?inline'
import { when } from 'lit/directives/when.js';

/**
 * @slot - Video-controls main content
 * */
@customElement('video-controls')
export class VideoControls extends DependentPropsMixin(LitElement) {
  static styles = unsafeCSS(styles)

  @connect('idle')
  @property({ type: Boolean, reflect: true })
  idle: boolean
  
  @connect('isPlaying')
  @property({ type: Boolean, reflect: true })
  playing: boolean
  
  @connect('isFullscreen')
  @property({ type: Boolean, reflect: true })
  fullscreen: boolean
  
  @property({ type: Boolean, reflect: true })
  custom = false
  
  @connect('isIos')
  isIos: boolean

  render() {
    return html`
      ${when(!this.isIos, () => html`<slot></slot>`)}
    `
  }
}
