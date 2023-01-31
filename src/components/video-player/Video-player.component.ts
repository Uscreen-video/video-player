import { connect, createState, dispatch, listen, Types } from '../../state'
import { unsafeCSS, LitElement, html, CSSResultGroup } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './Video-player.styles.css?inline'

import '../video-controls'
import '../video-container'
import { FullscreenController } from '../../controllers/Fullscreen'
import { IdleController } from '../../controllers/Idle'

@customElement('video-player')
export class VideoPlayer extends LitElement {
  static styles?: CSSResultGroup = unsafeCSS(styles)
  public state = createState(this)
  public fullscreen = new FullscreenController(this)
  private _idle = new IdleController(this)
  
  @property({ type: String, attribute: 'fullscreen-element'})
  fullscreenContainer: string

  @property({ type: Boolean, reflect: true })
  idle = false

  @property({ type: Number, attribute: 'idle-timeout' })
  idleTimeout = 9000

  @listen(Types.Command.toggleFullscreen)
  toggleFullscreen = () => {
    this.state.value.isFullscreen
      ? this.fullscreen.exit()
      : this.fullscreen.enter()
  }

  handleInteraction = () => {
    dispatch(this, Types.Action.interacted)
    this.disconnectedCallback()
  }

  connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('click', this.handleInteraction, { once: true })
  }

  disconnectedCallback(): void {
    document.removeEventListener('click', this.handleInteraction)
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
