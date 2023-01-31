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
  private idleTimer = new IdleController(this, this.handleIdleUpdate)
  
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

  handleIdleUpdate(value: boolean) {
    if (this.idle === value) return
    this.idle = value
    dispatch(this, Types.Action.idle, { idle: value })
  }

  handleClick = () => {
    dispatch(this, Types.Action.interacted)
    document.removeEventListener('click', this.handleClick)
    document.removeEventListener('touch', this.handleClick)
  }

  handleMove = () => {
    this.idleTimer.reset()
  }

  connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('click', this.handleClick, { once: true })
    document.addEventListener('touch', this.handleClick, { once: true })
    this.addEventListener('touchstart', this.handleMove, { passive: true })
    this.addEventListener('mousemove', this.handleMove, { passive: true })
    this.addEventListener('mouseleave', this.handleMove, { passive: true })
  }

  disconnectedCallback(): void {
    document.removeEventListener('click', this.handleClick)
    document.addEventListener('touch', this.handleClick, { once: true })
    this.removeEventListener('touchstart', this.handleMove)
    this.removeEventListener('mousemove', this.handleMove)
    this.removeEventListener('mouseleave', this.handleMove)
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
