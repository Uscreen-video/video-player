import { createState, dispatch, listen, Types } from '../../state'
import { unsafeCSS, LitElement, html, CSSResultGroup } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './Video-player.styles.css?inline'

import '../video-controls'
import '../video-container'
import { FullscreenController } from '../../controllers/Fullscreen'

@customElement('video-player')
export class VideoPlayer extends LitElement {
  static styles?: CSSResultGroup = unsafeCSS(styles)
  public state = createState(this)
  public fullscreen = new FullscreenController(this)
  
  @property({ type: String, attribute: 'fullscreen-element'})
  fullscreenContainer: string

  @listen(Types.Command.toggleFullscreen)
  toggleFullscreen = () => {
    this.state.value.isFullscreen
      ? this.fullscreen.exit()
      : this.fullscreen.enter()
  }

  handlePause = () => {
    dispatch(this, Types.Action.pause)
  }

  connectedCallback(): void {
    super.connectedCallback()
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
