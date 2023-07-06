import { connect, createCommand, dispatch, listen, Types } from '../../state'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, eventOptions, property, queryAssignedElements } from 'lit/decorators.js'
import styles from './Video-container.styles.css?inline'
import type Hls from 'hls.js'
import { getCueText } from '../../helpers/cue'
import { getBufferedEnd } from '../../helpers/buffer'
import { connectMuxData } from '../../helpers/mux'
import { MuxParams } from '../../types'

/**
 * @slot - Video-container main content
 * */
@customElement('video-container')
export class VideoContainer extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  hls: Hls
  initTime: number

  @queryAssignedElements({ selector: 'video', flatten: true })
  videos: HTMLVideoElement[]

  @connect('activeTextTrack')
  activeTextTrack: string

  @connect('muxData')
  muxData: MuxParams

  @connect('castActivated')
  castActivated: string

  @connect('isMobileSafari')
  @property({ type: Boolean, reflect: true, attribute: 'mobile-safari' })
  mobileSafari: true

  @listen(Types.Command.play, { canPlay: true, castActivated: false })
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

  @listen(Types.Command.togglePlay, { castActivated: false })
  togglePlay() {
    return this.videos[0].paused
      ? this.play()
      : this.pause()
  }

  @listen(Types.Command.seek, { canPlay: true })
  seek({ time }: { time: number }) {
    const [video] = this.videos
    video.currentTime = time
    if (video.paused && !this.castActivated) video.play()
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
    this.videos[0].muted = false
    this.videos[0].volume = Math.min(1, Math.max(0, volume))
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

  @listen(Types.Command.setPlaybackRate)
  setPlaybackRate({ playbackRate }: { playbackRate: number }) {   
    this.videos[0].playbackRate = playbackRate
  }

  @listen(Types.Command.requestAirplay)
  requestAirplay() {   
    (this.videos[0] as any).webkitShowPlaybackTargetPicker()
  }

  @listen(Types.Command.setQualityLevel, { customHLS: true })
  setHLSQualityLevel({ level }: { level: number }) {
    const qualityLevelIdx = this.hls.levels.findIndex(({ height }) => height === level)
    this.hls.nextLevel = qualityLevelIdx
    if (qualityLevelIdx === -1) {
      dispatch(this, Types.Action.setQualityLevel, {
        activeQualityLevel: -1
      })
    }
  }

  @listen(Types.Command.init, { isSourceSupported: true })
  initNative() {
    console.log('here')
    if (this.muxData) connectMuxData(
      this.videos[0],
      { ...this.muxData, player_init_time: this.initTime }
    )
  }

  @listen(Types.Command.initCustomHLS)
  @listen(Types.Command.init, { isSourceSupported: false })
  async initHls() {
    const HLS = (await import('hls.js/dist/hls.light.min.js')).default
    if (!HLS.isSupported()) return

    this.hls?.destroy()
  
    this.hls = new HLS({
      maxMaxBufferLength: 30,
      enableWorker: true,
      initialLiveManifestSize: 2,
      liveSyncDurationCount: 5,
      fragLoadingMaxRetry: 10,
      manifestLoadingMaxRetry: 2,
      levelLoadingMaxRetry: 4,
      backBufferLength: navigator.userAgent.match(/Android/i) ? 0 : 30
    })
    
    if (this.muxData) await connectMuxData(
      this.videos[0],
      { ...this.muxData, player_init_time: this.initTime },
      { Hls: HLS, hlsjs: this.hls }
    )

    this.hls.on(HLS.Events.LEVEL_UPDATED, (_: unknown, { level }: { level: number }) => {
      dispatch(this, Types.Action.setQualityLevel, {
        activeQualityLevel: this.hls.levels[level]?.height || -1
      })
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

    dispatch(this, Types.Action.update, { canPlay: true, customHLS: true })
  }


  @eventOptions({ capture: true })
  handleVideoEvent(e: Event & { target: HTMLVideoElement }) {
    const type = e.type
    const video = e.target

    switch (type) {
      case 'play':
        dispatch(this, Types.Action.play)
        break
      case 'pause':
        dispatch(this, Types.Action.pause)
        break
      case 'timeupdate':
        dispatch(this, Types.Action.updateTime, {
          currentTime: video.currentTime,
          duration: video.duration // Required for New android devices
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
      case 'ratechange':
        dispatch(this, Types.Action.setPlaybackRate, {
          playbackRate: video.playbackRate
        })
        break
      case 'progress':
        dispatch(this, Types.Action.setBuffer, {
          buffered: getBufferedEnd(video)
        })
        break
      case 'webkitplaybacktargetavailabilitychanged':
        dispatch(this, Types.Action.updateAirplayStatus, {
          airplayAvailable: (e as any).availability === 'available'
        })
        break
      case 'webkitcurrentplaybacktargetiswirelesschanged':
        dispatch(this, Types.Action.toggleAirplay)
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

    dispatch(this, Types.Action.cues, {
      cues: Array.from(target.track.activeCues)
        .map((cue: VTTCue) => cue.getCueAsHTML())
        .flatMap(getCueText)
    })
  }

  @eventOptions({ capture: true })
  handleClick() {
    if (this.mobileSafari) return
    this.togglePlay()
  }

  setup() {
    const [{
      autoplay, muted, poster,
      volume, duration, currentTime,
      playbackRate, title
    }] = this.videos

    this.initTime = Date.now()

    // Show native controls on safari browser
    if (this.mobileSafari) this.videos[0].setAttribute('controls', 'true')

    dispatch(this, Types.Action.init, {
      poster,
      duration,
      currentTime,
      volume,
      title,
      playbackRate,
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
        @ratechange=${this.handleVideoEvent}
        @volumechange=${this.handleVideoEvent}
        @progress=${this.handleVideoEvent}
        @cuechange=${this.handleCueChange}
        @click=${this.handleClick}
        @webkitcurrentplaybacktargetiswirelesschanged=${this.handleVideoEvent}
        @webkitplaybacktargetavailabilitychanged=${this.handleVideoEvent}
      ></slot>
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
