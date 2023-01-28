import { unsafeCSS, LitElement, html, CSSResultGroup } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createState, listen, dispatch } from '../../state'
import styles from './Video-player.styles.css?inline'
import '../video-controls'
import '../video-play-button'

@customElement('video-player')
export class VideoPlayer extends LitElement {
  static styles?: CSSResultGroup = unsafeCSS(styles)

  public state = createState(this)
  
  @listen('play')
  handlePlay() {
    dispatch(this, 'click')
  }

  connectedCallback(): void {
    super.connectedCallback()
    setInterval(() => {
      const value = this.state.value.value + 1
      this.state.setValue({ ...this.state.value, value })
    }, 1000)
  }

  render() {
    return html`
      <slot name="video"></slot>
      <video-controls>
        <slot></slot>
      </video-controls>
    `
  }
}
