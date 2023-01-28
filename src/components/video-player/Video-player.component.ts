import { unsafeCSS, LitElement, html, CSSResultGroup } from 'lit'
import { customElement, property, queryAssignedElements, queryAssignedNodes, state } from 'lit/decorators.js'
import { createState, listen, dispatch } from '../../state'
import styles from './Video-player.styles.css?inline'
import '../video-controls'
import '../video-play-button'
import { Action, Command } from '../../state/types'

@customElement('video-player')
export class VideoPlayer extends LitElement {
  static styles?: CSSResultGroup = unsafeCSS(styles)

  public state = createState(this)
  
  @queryAssignedElements({ selector: 'video', slot: 'video' })
  video: HTMLVideoElement[]

  @listen(Command.play)
  playVideo() {
    return this.video[0].play()
  }

  @listen(Command.pause)
  pauseVideo() {
    return this.video[0].pause()
  }

  handlePlay = () => {
    dispatch(this, Action.play)
  }

  handlePause = () => {
    dispatch(this, Action.pause)
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
