import { connect, createCommand, dispatch, listen, Types } from '../../state'
import { CommandParams } from '../../state/events'
import { State } from '../../types'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, eventOptions, queryAssignedElements, property } from 'lit/decorators.js'
import styles from './Video-container.styles.css?inline'
import type Hls from 'hls.js'
import { getBufferedEnd } from '../../helpers/buffer'
import { connectMuxData } from '../../helpers/mux'
import { createProvider, StorageProvider } from '../../helpers/storage'
import { MuxParams } from '../../types'
import { when } from 'lit/directives/when.js'
import '../buttons/Play'
import { subtitlesController, SubtitlesController } from './subtitles'
import HLS from 'hls.js'

const END_OF_STREAM_SECONDS = 99999

const INIT_NATIVE_HLS_RE = /^((?!chrome|android).)*safari/i

// In Safari on live streams video.duration = Infinity
const getVideoDuration = (video: HTMLVideoElement) => video.duration === Infinity
  ? video.seekable.end(0)
  : video.duration

/**
 * @slot - Video-container main content
 * */
@customElement('video-container')
export class VideoContainer extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)
  private subtitles: SubtitlesController

  hls: Hls
  initTime: number

  @queryAssignedElements({ selector: 'video', flatten: true })
  videos: HTMLVideoElement[]

  @connect('poster')
  poster: string

  @connect('title')
  title: string

  @connect('played')
  played: boolean

  @connect('canPlay')
  canPlay: boolean

  @connect('muxData')
  muxData: MuxParams

  @connect('castActivated')
  castActivated: string

  @connect('live')
  live: boolean

  @property({ type: String, attribute: 'storage-key' })
  storageKey: string

  _storageProvider: StorageProvider
  connectedCallback() {
    super.connectedCallback();
    this._storageProvider = createProvider(this.storageKey)
  }

  @listen(Types.Command.play, { canPlay: true, castActivated: false })
  async play() {
    try {
      const shouldRewindToEnd = !this.played && this.live
      await this.videos[0].play()
      if (shouldRewindToEnd) {
        window.requestAnimationFrame(() => {
          this.videos[0].currentTime = END_OF_STREAM_SECONDS
        })
      }
    } catch (e) {
      if (e.toString().includes('source')) {
        this.command(Types.Command.initCustomHLS)
      }
      dispatch(this, Types.Action.update, { isPlaying: false, played: false })
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
    if (video.paused && !this.castActivated) this.play()
    dispatch(this, Types.Action.live, {
      live: false
    })
  }

  @listen(Types.Command.forward)
  forward() {
    this.seek({
      time: Math.min(this.videos[0].currentTime + 10, getVideoDuration(this.videos[0]))
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

  @listen(Types.Command.live, { canPlay: true, initialized: true })
  enableLiveMode() {
    dispatch(this, Types.Action.live, {
      live: true
    })
    window.requestAnimationFrame(() => {
      this.videos[0].currentTime = END_OF_STREAM_SECONDS
      if (this.videos[0].paused && !this.castActivated) this.play()
    })
  }

  @listen(Types.Command.enableTextTrack)
  enableTextTrack({ lang }: { lang: string }) {    
    dispatch(this, Types.Action.selectTextTrack, {
      activeTextTrack: lang
    })
    this.subtitles.enableTextTrack(lang)
  }

  @listen(Types.Command.setPlaybackRate, { canPlay: true })
  setPlaybackRate({ playbackRate }: { playbackRate: number }) {   
    this.videos[0].playbackRate = this.videos[0].defaultPlaybackRate = playbackRate
  }

  @listen(Types.Command.requestAirplay)
  requestAirplay() {   
    (this.videos[0] as any).webkitShowPlaybackTargetPicker()
  }

  @listen(Types.Command.setQualityLevel, { customHLS: true })
  setHLSQualityLevel({ level }: { level: number }) {
    const qualityLevelIdx = this.hls.levels.findIndex(({ height }) => height === level)
    this.hls.nextLevel = qualityLevelIdx
    // We need to update state here as well, as HLS.Events.LEVEL_UPDATED sometimes not triggered
    dispatch(this, Types.Action.setQualityLevel, {
      activeQualityLevel: qualityLevelIdx === -1 ? -1 : level
    })
  }

  @listen(Types.Command.togglePip)
  togglePip() {
    if (!document.pictureInPictureElement) {
      this.videos[0].requestPictureInPicture()
    } else {
      document.exitPictureInPicture()
    }
  }

  @listen(Types.Command.init, { isSourceSupported: true })
  initNative() {
    if (this.muxData) connectMuxData(
      this.videos[0],
      { ...this.muxData, player_init_time: this.initTime }
    )
  }

  @listen(Types.Command.initCustomHLS)
  @listen(Types.Command.init, { isSourceSupported: false })
  async initHls() {
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
      backBufferLength: navigator.userAgent.match(/Android/i) ? 0 : 30,
      liveDurationInfinity: true
    })
    
    if (this.muxData) await connectMuxData(
      this.videos[0],
      { ...this.muxData, player_init_time: this.initTime },
      { Hls: HLS, hlsjs: this.hls }
    )

    this.hls.on(HLS.Events.LEVEL_LOADED, () => {
      dispatch(this, Types.Action.canPlay)
    })

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
      const { activeQualityLevel } = this._storageProvider.get()
      if (activeQualityLevel >= 0) {
        const qualityLevelIdx = levels.findIndex(({ height }) => height === activeQualityLevel)
        if (qualityLevelIdx >= 0) {
          this.hls.nextLevel = qualityLevelIdx
          dispatch(this, Types.Action.setQualityLevel, {
            activeQualityLevel
          })
        }
      }

      this.hls.subtitleDisplay = false
    })
    
    this.hls.loadSource(this.videoSource);
    this.hls.attachMedia(this.videos[0]);
    
    dispatch(this, Types.Action.update, { customHLS: true })
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
          duration: getVideoDuration(video) // Required for New android devices
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
          initialized: true,
          duration: getVideoDuration(video)
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
      case 'enterpictureinpicture':
        dispatch(this, Types.Action.togglePip, { pipActivated: true })
        break
      case 'leavepictureinpicture':
        dispatch(this, Types.Action.togglePip, { pipActivated: false })
        break
      case 'loadedmetadata':
        dispatch(this, Types.Action.canPlay)
        break
    }
  }


  @eventOptions({ capture: true })
  handleClick() {
    this.togglePlay()
  }

  @listen(Types.Command.setVolume)
  @listen(Types.Command.setQualityLevel)
  @listen(Types.Command.mute)
  @listen(Types.Command.unmute)
  @listen(Types.Command.toggleMuted)
  @listen(Types.Command.setPlaybackRate)
  @listen(Types.Command.enableTextTrack)
  _syncStateWithStorage(params: CommandParams, _: any, command: Types.Command) {
    if (!this.storageKey) return

    let key: keyof State
    let value: unknown

    switch (command) {
      case Types.Command.setVolume:
        key = 'volume'
        value = +params.volume
        break
      case Types.Command.setQualityLevel:
        key = 'activeQualityLevel'
        value = +params.level
        break
      case Types.Command.toggleMuted:
      case Types.Command.mute:
      case Types.Command.unmute:
        key = 'isMuted'
        value = this.videos[0].muted
        break
      case Types.Command.setPlaybackRate:
        key = 'playbackRate'
        value = +params.playbackRate
        break
      case Types.Command.enableTextTrack:
        key = 'activeTextTrack'
        value = params.lang
        break
    }
    const currentVal = this._storageProvider.get()
    this._storageProvider.set({ ...currentVal, [key]: value })
  }

  setup() {
    // active quality level will be initialized in HLS callback
    const { activeQualityLevel, ...savedSettings } = this._storageProvider.get()
    
    if (typeof savedSettings.isMuted === 'boolean') {
      this.videos[0].muted = savedSettings.isMuted
    }
    
    if (typeof savedSettings.volume === 'number') {
      this.videos[0].volume = savedSettings.volume
    }
    
    
    this.subtitles = subtitlesController(this, this.videos[0], savedSettings.activeTextTrack)

    const [{
      autoplay, muted, poster,
      volume, currentTime,
      playbackRate, title
    }] = this.videos

    this.initTime = Date.now()

    dispatch(this, Types.Action.init, {
      poster,
      duration: getVideoDuration(this.videos[0]),
      currentTime,
      volume,
      title,
      sources: this.videoSources,
      src: this.videoSource,
      isAutoplay: autoplay,
      isMuted: muted,
      playbackRate,
      isSourceSupported: !INIT_NATIVE_HLS_RE.test(navigator.userAgent) ? false : Boolean(this.supportedSource),
      ...savedSettings
    })

    this.command(Types.Command.init)

    this.command(Types.Command.setPlaybackRate, {
      playbackRate: typeof savedSettings.playbackRate === 'number'
        ? savedSettings.playbackRate
        : playbackRate
    })

  }

  @eventOptions({ capture: true })
  onError(error: { target: HTMLVideoElement }) {
    if (error.target && error.target.error instanceof MediaError && error.target.error.code === 4) {
      this.command(Types.Command.initCustomHLS)
    }
  }

  onPlayClick(e: { target: HTMLDivElement }) {
    if (e.target.nodeName === 'DIV') {
      this.command(Types.Command.play)
    }
  }

  _boundingRect: DOMRect
  get boundingRect(): DOMRect {
    this._boundingRect = this._boundingRect || this.getBoundingClientRect()
    return this._boundingRect
  }

  _videoRect: DOMRect
  handleDblClick(e: PointerEvent) {
    const { x, width } = this.boundingRect
    const xPercentage = ((e.clientX - x) / width) * 100
    if (xPercentage < 33) {
      this.command(Types.Command.backward)
    }
    if (xPercentage > 66) {
      this.command(Types.Command.forward)
    }
  }

  render() {
    return html`
      <slot
        @slotchange=${this.setup}
        @play=${this.handleVideoEvent}
        @pause=${this.handleVideoEvent}
        @timeupdate=${this.handleVideoEvent}
        @loadeddata=${this.handleVideoEvent}
        @loadedmetadata=${this.handleVideoEvent}
        @ratechange=${this.handleVideoEvent}
        @volumechange=${this.handleVideoEvent}
        @enterpictureinpicture=${this.handleVideoEvent}
        @leavepictureinpicture=${this.handleVideoEvent}
        @progress=${this.handleVideoEvent}
        @click=${this.handleClick}
        @dblclick=${this.handleDblClick}
        @webkitcurrentplaybacktargetiswirelesschanged=${this.handleVideoEvent}
        @webkitplaybacktargetavailabilitychanged=${this.handleVideoEvent}
      ></slot>
      ${when(this.poster && !this.played, () => html`
        <img
          src=${this.poster} 
          alt=${this.title} 
          @click=${this.handleClick} 
        />
      `)}
      ${when(this.canPlay && !this.played, () => html`
        <div class="play-button" @click=${this.onPlayClick}>
          <video-play-button></video-play-button>
        </div>
      `)}
    `
  }

  get videoSources(): State['sources'] {
    return Array.from(this.videos[0].querySelectorAll('source')).map(s => ({
      type: s.type,
      src: s.src
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
