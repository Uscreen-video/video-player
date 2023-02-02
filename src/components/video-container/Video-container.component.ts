import { connect, createCommand, dispatch, listen, Types } from '../../state'
import { unsafeCSS, LitElement } from 'lit'
import { unsafeStatic, html } from 'lit/static-html.js'
import { customElement, eventOptions, queryAssignedElements, state } from 'lit/decorators.js'
import styles from './Video-container.styles.css?inline'
import type { Hls } from 'hls.js'
import { getCueText } from '../../helpers/cue'
import { when } from 'lit/directives/when.js'

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

  @state()
  cues: string[] = []

  @connect('activeTextTrack')
  activeTextTrack: string

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

  @listen(Types.Command.enableTextTrack)
  enableTextTrack({ lang }: { lang: string }) {    
    this.videoTracks.forEach(({ track, srclang }) => {
      track.mode = srclang === lang ? 'showing' : 'hidden'
    })
    dispatch(this, Types.Action.selectTextTrack, {
      activeTextTrack: lang
    })
  }

  @listen(Types.Command.initCustomHLS)
  @listen(Types.Command.init, { isSourceSupported: false })
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

    this.hls.on(HLS.Events.MANIFEST_PARSED, (_: unknown, { levels }: { levels: unknown[] }) => {
      dispatch(this, Types.Action.setLevels, {
        qualityLevels: levels.map((level: { height: string }) => ({
          name: level.height || 'auto'
        }))
      })
    })

    this.hls.loadSource(this.videoSource);
    this.hls.attachMedia(this.videos[0]);

    dispatch(this, Types.Action.update, { canPlay: true })
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

  @eventOptions({ capture: true })
  handleCueChange({ target }: { target: HTMLTrackElement }) {
    const activeTextTrack = target.track.mode === 'showing' ? target.srclang : ''

    if (activeTextTrack !== this.activeTextTrack) {
      dispatch(this, Types.Action.selectTextTrack, {
        activeTextTrack
      })
    }

    this.cues = Array.from(target.track.activeCues)
      .map((cue: VTTCue) => cue.getCueAsHTML())
      .flatMap(getCueText)
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
      isSourceSupported: Boolean(this.supportedSource),
      textTracks: this.videoCues
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
        @cuechange=${this.handleCueChange}
      ></slot>
      ${when(this.activeTextTrack, () => html`
        
        <div class="cues">
          ${this.cues.map(cue => html`
            <div class="cue">
              <span>${unsafeStatic(cue)}</span>
            </div>
          `)}
        </div>
      `)}
    `
  }

  get videoSources() {
    return Array.from(this.videos[0].querySelectorAll('source'))
  }

  get videoTracks() {
    return Array.from(this.videos[0].querySelectorAll('track'))
  }

  get videoCues() {
    return this.videoTracks.map(track => ({
      src: track.src,
      lang: track.srclang,
      label: track.label,
    }))
  }

  get videoSource() {
    return this.videos[0].currentSrc ||
      this.supportedSource?.src ||
      this.videoSources[0].src
  }

  get supportedSource() {
    const [video] = this.videos
    return this.videoSources.find(s => video.canPlayType(s.type))
  }
}
