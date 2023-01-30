import { connect, createCommand, dispatch, listen, Types } from '../../state'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, eventOptions, queryAssignedElements } from 'lit/decorators.js'
import styles from './Video-container.styles.css?inline'
import { Action, Command, State } from '../../state/types'
import type { Hls } from 'hls.js'

/**
 * @slot - Video-container main content
 * */
@customElement('video-container')
export class VideoContainer extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  hls: Hls

  @queryAssignedElements({ selector: 'video', flatten: true })
  videos: HTMLVideoElement[]

  @connect()
  state: State

  @listen(Types.Command.play, { canPlay: true })
  async onPlayCommand() {
    try {
      await this.videos[0].play()
    } catch (e) {
      dispatch(this, Action.update, { canPlay: false })
      this.command(Types.Command.initCustomHLS)
      throw e
    }
  }

  @listen(Types.Command.seek, { canPlay: true })
  async onSeekCommand({ time }: { time: number }) {
    this.videos[0].currentTime = time
  }

  @listen(Types.Command.initCustomHLS)
  @listen(Types.Command.init, { isNativeHLS: false })
  async handleHLSInit() {
    const HLS = (await import('hls.js')).default
    if (!HLS.isSupported()) return

    this.hls?.destroy()
  
    this.hls = new HLS({
      maxMaxBufferLength: 30,
      enableWorker: false,
      initialLiveManifestSize: 2,
      liveSyncDurationCount: 5,
      fragLoadingMaxRetry: 10,
      manifestLoadingMaxRetry: 2,
      levelLoadingMaxRetry: 4,
    })

    this.hls.loadSource(this.videoSource);
    this.hls.attachMedia(this.videos[0]);
    dispatch(this, Action.update, { canPlay: true })
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

  @eventOptions({ capture: true })
  handleTimeUpdate(e: { target: HTMLVideoElement }) {
    dispatch(this, Types.Action.update, {
      currentTime: e.target.currentTime
    })
  }

  @eventOptions({ capture: true })
  handleLoadedData(e: { target: HTMLVideoElement}) {
    dispatch(this, Types.Action.update, {
      duration: e.target.duration
    })
  }

  initVideo() {
    const [{ autoplay, muted, poster, duration, currentTime }] = this.videos
    dispatch(this, Types.Action.update, {
      poster,
      duration,
      currentTime,
      src: this.videoSource,
      isAutoplay: !!autoplay,
      isMuted: !!muted,
      isNativeHLS: this.supportsHLS,
    })

    this.command(Types.Command.init)
  }

  render() {
    return html`
      <slot
        @slotchange=${this.initVideo}
        @play=${this.handlePlay}
        @pause=${this.handlePause}
        @timeupdate=${this.handleTimeUpdate}
        @loadeddata=${this.handleLoadedData}
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
