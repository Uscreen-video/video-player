import { createCommand, createState, dispatch, listen, Types } from '../../state'
import { unsafeCSS, LitElement, html, CSSResultGroup } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './Video-player.styles.css?inline'
import '../video-controls'
import '../video-container'
import { FullscreenController } from './controllers/Fullscreen'
import { IdleController } from './controllers/Idle'
import { KeyboardController } from './controllers/Keyboard'

@customElement('video-player')
export class VideoPlayer extends LitElement {
  static styles?: CSSResultGroup = unsafeCSS(styles)
  protected idleManager = new IdleController(this, this.handleIdleUpdate)
  protected keyboardManager = new KeyboardController(this)

  public command = createCommand(this)
  public state = createState(this)
  public fullscreen = new FullscreenController(this)
  
  @property({ type: String, attribute: 'fullscreen-element'})
  fullscreenContainer: string

  @property({ type: Boolean, reflect: true })
  idle = false

  @property({ type: Boolean })
  autofocus = false

  @property({ type: Number, attribute: 'idle-timeout' })
  idleTimeout = 9000

  @property({ type: Number, attribute: true, reflect: true })
  tabindex = 0

  @listen(Types.Command.toggleFullscreen)
  toggleFullscreen = () => {
    this.state.value.isFullscreen
      ? this.fullscreen.exit()
      : this.fullscreen.enter()
  }

  handleIdleUpdate(idle: boolean) {
    if (this.idle === idle) return
    if (!this.state.value.isPlaying && idle) {
      dispatch(this, Types.Action.idle, { idle: false })
    }
    this.idle = idle
    dispatch(this, Types.Action.idle, { idle })
  }

  handleClick = () => {
    dispatch(this, Types.Action.interacted)
    document.removeEventListener('click', this.handleClick)
    document.removeEventListener('touch', this.handleClick)
    document.removeEventListener('keydown', this.handleClick)
  }

  handleMove = () => {
    this.idleManager.reset()
  }

  connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('click', this.handleClick, { once: true })
    document.addEventListener('touch', this.handleClick, { once: true })
    document.addEventListener('keydown', this.handleClick, { once: true })
    this.addEventListener('touchstart', this.handleMove, { passive: true })
    this.addEventListener('mousemove', this.handleMove)
    this.addEventListener('mouseleave', this.handleMove)
  }

  disconnectedCallback(): void {
    document.removeEventListener('click', this.handleClick)
    document.removeEventListener('touch', this.handleClick)
    this.removeEventListener('touchstart', this.handleMove)
    this.removeEventListener('mousemove', this.handleMove)
    this.removeEventListener('mouseleave', this.handleMove)
  }

  render() {
    return html`
      <video-container>
        <slot name="video"></slot>
      </video-container>
      <slot></slot>
    `
  }
}
