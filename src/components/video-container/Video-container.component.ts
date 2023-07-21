import { connect, createCommand, dispatch, listen, Types } from '../../state'
import { CommandParams } from '../../state/events'
import { State } from '../../types'
import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, eventOptions, queryAssignedElements, property } from 'lit/decorators.js'
import styles from './Video-container.styles.css?inline'
import type Hls from 'hls.js'
import { getCueText } from '../../helpers/cue'
import { getBufferedEnd } from '../../helpers/buffer'
import { connectMuxData } from '../../helpers/mux'
import { createProvider, StorageProvider, StorageValue } from '../../helpers/storage'
import { MuxParams } from '../../types'
import { when } from 'lit/directives/when.js'


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

  @connect('poster')
  poster: string

  @connect('title')
  title: string

  @connect('played')
  played: boolean

  @connect('muxData')
  muxData: MuxParams

  @connect('castActivated')
  castActivated: string

  @property({ type: String, attribute: 'storage-key' })
  storageKey: string

  _storageProvider: StorageProvider
  connectedCallback() {
    super.connectedCallback();
    if (this.storageKey) {
      this._storageProvider = createProvider(this.storageKey)
    }
  }

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

  private _enableTextTrack(lang: string) {
    this.videoTracks.forEach(({ track, srclang }) => {
      track.mode = srclang === lang ? 'showing' : 'hidden'
    })
  }

  @listen(Types.Command.enableTextTrack)
  enableTextTrack({ lang }: { lang: string }) {    
    this._enableTextTrack(lang)
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
      const { activeQualityLevel } = this._storageProvider ? this._storageProvider.get() : {} as StorageValue
      if (activeQualityLevel >= 0) {
        const qualityLevelIdx = levels.findIndex(({ height }) => height === activeQualityLevel)
        if (qualityLevelIdx >= 0) {
          this.hls.nextLevel = qualityLevelIdx
          dispatch(this, Types.Action.setQualityLevel, {
            activeQualityLevel
          })
        }
      }
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
      case 'enterpictureinpicture':
        dispatch(this, Types.Action.togglePip, { pipActivated: true })
        break
      case 'leavepictureinpicture':
        dispatch(this, Types.Action.togglePip, { pipActivated: false })
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
    if (!this._storageProvider) return

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
    const { activeQualityLevel, ...savedSettings } = this._storageProvider ? this._storageProvider.get() : {} as StorageValue
    
    if (typeof savedSettings.isMuted === 'boolean') {
      this.videos[0].muted = savedSettings.isMuted
    }

    if (typeof savedSettings.activeTextTrack === 'string') {
      this._enableTextTrack(savedSettings.activeTextTrack)
    }

    if (typeof savedSettings.volume === 'number') {
      this.videos[0].volume = savedSettings.volume
    }

    const [{
      autoplay, muted, poster,
      volume, duration, currentTime,
      playbackRate, title
    }] = this.videos

    this.initTime = Date.now()

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
      textTracks: this.videoCues,
      ...savedSettings
    })

    this.command(Types.Command.init)

    /**
     * For some reasons if we update playback rate in setup method - playback updates twice and second time always with value = 1
     * I didn't found root cause of that issue
     */
    if (typeof savedSettings.playbackRate === 'number') {
      setTimeout(() => {
        this.command(Types.Command.setPlaybackRate, { playbackRate: savedSettings.playbackRate })
      }, 100)
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
        @ratechange=${this.handleVideoEvent}
        @volumechange=${this.handleVideoEvent}
        @enterpictureinpicture=${this.handleVideoEvent}
        @leavepictureinpicture=${this.handleVideoEvent}
        @progress=${this.handleVideoEvent}
        @cuechange=${this.handleCueChange}
        @click=${this.handleClick}
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
