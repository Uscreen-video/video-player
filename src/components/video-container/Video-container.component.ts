import { createCommand, dispatch, listen, Types } from '../../state'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, eventOptions, queryAssignedElements } from 'lit/decorators.js'
import styles from './Video-container.styles.css?inline'
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

  @listen(Types.Command.play, { canPlay: true })
  async onPlayCommand() {
    try {
      await this.videos[0].play()
    } catch (e) {
      dispatch(this, Types.Action.update, { canPlay: false })
      this.command(Types.Command.initCustomHLS)
      throw e
    }
  }

  @listen(Types.Command.seek, { canPlay: true })
  async onSeekCommand({ time }: { time: number }) {
    this.videos[0].currentTime = time
  }

  @listen(Types.Command.mute)
  async onMuteCommand() {
    this.videos[0].muted = true
  }

  @listen(Types.Command.unmute)
  async onUnMuteCommand() {
    this.videos[0].muted = false
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
    dispatch(this, Types.Action.update, { canPlay: true })
  }

  @listen(Types.Command.pause)
  pauseVideo() {
    return this.videos[0].pause()
  }

  @eventOptions({ capture: true })
  handlePlay() {
    dispatch(this, Types.Action.play)
  }

  @eventOptions({ capture: true })
  handlePause() {
    dispatch(this, Types.Action.pause)
  }

  @eventOptions({ capture: true })
  handleTimeUpdate(e: { target: HTMLVideoElement }) {
    dispatch(this, Types.Action.updateTime, {
      currentTime: e.target.currentTime
    })
  }

  @eventOptions({ capture: true })
  handleLoadedData(e: { target: HTMLVideoElement}) {
    dispatch(this, Types.Action.updateDuration, {
      duration: e.target.duration
    })
  }

  @eventOptions({ capture: true })
  handleVolumeChange(e: { target: HTMLVideoElement }) {
    dispatch(this, Types.Action.volumeChange, {
      value: e.target.volume,
      isMuted: e.target.muted
    })
  }

  initVideo() {
    const [{ autoplay, muted, poster, volume, duration, currentTime }] = this.videos
    dispatch(this, Types.Action.init, {
      poster,
      duration,
      currentTime,
      volume,
      src: this.videoSource,
      isAutoplay: autoplay,
      isMuted: muted,
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
        @volumechange=${this.handleVolumeChange}
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
