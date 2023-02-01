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
  async play() {
    try {
      await this.videos[0].play()
    } catch (e) {
      dispatch(this, Types.Action.update, { canPlay: false })
      this.command(Types.Command.initCustomHLS)
      throw e
    }
  }

  @listen(Types.Command.pause)
  pause() {
    return this.videos[0].pause()
  }

  @listen(Types.Command.togglePlay)
  togglePlay() {
    return this.videos[0].paused
      ? this.play()
      : this.pause()
  }

  @listen(Types.Command.seek, { canPlay: true })
  seek({ time }: { time: number }) {
    this.videos[0].currentTime = time
  }

  @listen(Types.Command.forward)
  forward() {
    this.seek({
      time: Math.min(this.videos[0].currentTime + 10, this.videos[0].duration)
    })
  }

  @listen(Types.Command.backward)
  backward() {
    this.seek({
      time: Math.max(this.videos[0].currentTime - 10, 0)
    })
  }

  @listen(Types.Command.mute)
  mute() {
    this.videos[0].muted = true
  }

  @listen(Types.Command.toggleMuted)
  toggleMuted() {
    this.videos[0].muted
      ? this.unmute()
      : this.mute()
  }

  @listen(Types.Command.init, { isAutoplay: true, isMuted: true, isInteracted: true })
  @listen(Types.Command.unmute)
  unmute() {
    this.videos[0].muted = false
  }

  @listen(Types.Command.setVolume)
  setVolume({ volume }: { volume: number }) {
    return this.videos[0].volume = Math.min(1, Math.max(0, volume))
  }

  @listen(Types.Command.increaseVolume)
  increaseVolume() {
    this.setVolume({
      volume: this.videos[0].volume + 0.1
    })
  }

  @listen(Types.Command.decreaseVolume)
  decreaseVolume() {
    this.setVolume({
      volume: this.videos[0].volume - 0.1
    })
  }

  @eventOptions({ capture: true })
  handleVideoEvent(e: Event & { target: HTMLVideoElement }) {
    const type = e.type
    const [video] = this.videos
    switch (type) {
      case 'play':
        dispatch(this, Types.Action.play)
        break
      case 'pause':
        dispatch(this, Types.Action.pause)
        break
      case 'timeupdate':
        dispatch(this, Types.Action.updateTime, {
          currentTime: video.currentTime
        })
        break
      case 'volumechange':
        dispatch(this, Types.Action.volumeChange, {
          volume: video.volume,
          isMuted: video.muted
        })
        break
      case 'loadeddata':
        dispatch(this, Types.Action.updateDuration, {
          duration: video.duration
        })
        break
    }
  }


  @listen(Types.Command.initCustomHLS)
  @listen(Types.Command.init, { isNativeHLS: false })
  async initHls() {
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

  setup() {
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
        @slotchange=${this.setup}
        @play=${this.handleVideoEvent}
        @pause=${this.handleVideoEvent}
        @timeupdate=${this.handleVideoEvent}
        @loadeddata=${this.handleVideoEvent}
        @volumechange=${this.handleVideoEvent}
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
