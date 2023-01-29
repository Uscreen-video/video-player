import { connect, createCommand, dispatch, listen, Types } from '../../state'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, eventOptions, queryAssignedElements } from 'lit/decorators.js'
import styles from './Video-container.styles.css?inline'
import { State } from '../../types'
import { HlsController } from '../../controllers/hls'
/**
 * @slot - Video-container main content
 * */
@customElement('video-container')
export class VideoContainer extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)
  private hls = new HlsController(this)

  @queryAssignedElements({ selector: 'video', flatten: true })
  videos: HTMLVideoElement[]

  @connect()
  state: State

  @listen(Types.Command.play, { isMuted: true })
  playVideo() {
    console.log('"play" fired', this.state)
    return this.videos[0].play()
  }

  @listen(Types.Command.pause)
  pauseVideo() {
    return this.videos[0].pause()
  }

  @eventOptions({ capture: true })
  handlePlay() {
    console.log('video started')
    dispatch(this, Types.Action.play)
  }

  @eventOptions({ capture: true })
  handlePause() {
    console.log('video paused')
    dispatch(this, Types.Action.pause)
  }

  initVideo() {
    const [{ autoplay, muted, poster, }] = this.videos
    dispatch(this, Types.Action.update, {
      poster,
      src: this.videoSource,
      isAutoplay: !!autoplay,
      isMuted: !!muted,
      isNativeHLS: this.supportsHLS
    })

    this.command(Types.Command.init)
  }

  render() {
    return html`
      <slot
        @slotchange=${this.initVideo}
        @play=${this.handlePlay}
        @pause=${this.handlePause}
      ></slot>
    `
  }

  get videoSource() {
    return this.videos[0].currentSrc || this.videos[0].querySelector('source')?.src
  }

  get supportsHLS() {
    const [video] = this.videos
    const types = Array.from(video.querySelectorAll('source')).map(s => s.type)
    return !!types.find(t => video.canPlayType(t))
  }
}
