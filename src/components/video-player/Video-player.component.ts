import { createState, listen, dispatch, createCommand, Types } from '../../state'
import { unsafeCSS, LitElement, html, CSSResultGroup } from 'lit'
import { customElement, queryAssignedElements } from 'lit/decorators.js'
import styles from './Video-player.styles.css?inline'
import '../video-controls'
import '../video-play-button'

@customElement('video-player')
export class VideoPlayer extends LitElement {
  static styles?: CSSResultGroup = unsafeCSS(styles)
  public state = createState(this)
  public command = createCommand(this)
  
  @queryAssignedElements({ selector: 'video', slot: 'video' })
  video: HTMLVideoElement[]

  @listen(Types.Command.play)
  playVideo() {
    return this.video[0].play()
  }

  @listen(Types.Command.pause)
  pauseVideo() {
    return this.video[0].pause()
  }

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

  addVideoListeners = () => {
    this.video[0].addEventListener('play', this.handlePlay)
    this.video[0].addEventListener('pause', this.handlePause)
  }

  render() {
    return html`
      <slot name="video" @slotchange=${this.addVideoListeners}></slot>
      <video-controls>
        <slot></slot>
      </video-controls>
    `
  }
}
