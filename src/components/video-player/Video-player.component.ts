import { createState, dispatch, Types } from '../../state'
import { unsafeCSS, LitElement, html, CSSResultGroup } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './Video-player.styles.css?inline'

import '../video-controls'
import '../video-container'

@customElement('video-player')
export class VideoPlayer extends LitElement {
  static styles?: CSSResultGroup = unsafeCSS(styles)
  public state = createState(this)
  
  handlePlay = () => {
    dispatch(this, Types.Action.play)
  }

  handlePause = () => {
    dispatch(this, Types.Action.pause)
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
      <video-container>
        <slot name="video"></slot>
      </video-container>
      <video-controls>
        <slot name="controls"></slot>
      </video-controls>
    `
  }
}
