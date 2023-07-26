import { device } from "./helpers/device"
import type Hls from 'hls.js'

/**
 * Command are the actions that can be triggered by the user or a interface
 * They can be handled with the `@listen` decorator, and should not affect the state
 */
export enum Command {
  /** Play the video */
  play = 'play',
  /** Pause the video */
  pause = 'pause',
  /** Seek to a specific time */
  seek = 'seek',
  /** Mute the video */
  mute = 'mute',
  /** Unmute the video */
  unmute = 'unmute',
  /** Set playback rate */
  setPlaybackRate = 'setPlaybackRate',
  /** Toggle fullscreen mode */
  toggleFullscreen = 'toggleFullscreen',
  /** Toggle play/pause */
  togglePlay = 'togglePlay',
  /** Toggle mute/unmute */
  toggleMuted = 'toggleMuted',
  /** Set the video volume */
  setVolume = 'setVolume',
  /** Increase video volume */
  increaseVolume = 'increaseVolume',
  /** Decrease video volume */
  decreaseVolume = 'decreaseVolume',
  /** Seek forward for 10 seconds */
  forward = 'forward',
  /** Seek backward for 10 seconds */
  backward = 'backward',
  /** Enable a text track */
  enableTextTrack = 'enableTextTrack',
  /** Sets video quality */
  setQualityLevel = 'setQualityLevel',
  /** Initialize the custom HLS player */
  initCustomHLS = 'initCustomHLS',
  /** Initialize the video player */
  init = 'init',
  /** Request to play via AirPlay on IOS/MacOs devices */
  requestAirplay = 'requestAirplay',
  /** Triggers when ChromeCast is not supported in browser */
  castNotSupported = 'castNotSupported',
  /** Request playing video on ChromeCast device */
  requestCast = 'requestCast',
  /** Toggles "picture in picture" mode */
  togglePip = 'togglePip',
}

export enum Action {
  play = 'play',
  pause = 'pause',
  update = 'update',
  toggleMuted = 'toggleMuted',
  seekEnd = 'seekEnd',
  seekStart = 'seekStart',
  canPlay = 'canPlay',
  updateDuration = 'updateDuration',
  updateTime = 'updateTime',
  init = 'init',
  volumeChange = 'volumeChange',
  fullscreenChange = 'fullscreenChange',
  setLevels = 'setLevels',
  interacted = 'interacted',
  idle = 'idle',
  selectTextTrack = 'selectTextTrack',
  cues = 'cues',
  setPlaybackRate = 'setPlaybackRate',
  setQualityLevel = 'setQualityLevel',
  updateAirplayStatus = 'updateAirplayStatus',
  toggleAirplay = 'toggleAirplay',
  togglePip = 'togglePip',
  castAvailable = 'castAvailable',
  setCastStatus = 'setCastStatus',
  setBuffer = 'setBuffer',
  setMuxParams = 'setMuxParams',
  setVideoOffset = 'setVideoOffset',
}

export enum Event {
  state = 'video-state-update',
  bulk = 'video-bulk-state-update',
  command = 'video-command',
  registerCommand = 'video-register-command',
}

export type State = Partial<{
  value: number,
  duration: number,
  currentTime: number,
  src: string,
  sources: {
    type: string,
    src: string
  }[],
  title: string,
  poster: string,
  volume: number,
  canPlay: boolean,
  played: boolean,
  idle: boolean,
  isInteracted: boolean,
  isPlaying: boolean,
  isMuted: boolean,
  isAutoplay: boolean
  isSourceSupported: boolean,
  isFullscreen: boolean,
  activeTextTrack: string,
  activeQualityLevel: number,
  playbackRate: number,
  customHLS: boolean,
  airplayAvailable: boolean,
  airplayActivated: boolean,
  pipAvailable: boolean,
  pipActivated: boolean,
  castAvailable: boolean,
  castActivated: boolean,
  cues: string[],
  buffered: number,
  textTracks: {
    label: string,
    src: string,
    lang: string
  }[],
  qualityLevels: {
    name: string
  }[],
  muxData: MuxParams
} & typeof device>

export type MuxParams = {
  env_key: string
  
  /** any arbitrary string you want to use to identify this player */
  player_name?: string
  player_init_time?: number
  player_version?: string

  viewer_user_id?: string
  experiment_name?: string

  video_id?: string
  video_title?: string
  video_series?: string
  video_duration?: string
  video_stream_type?: string
  video_cdn?: string
}

export type MuxOptions = {
  debug?: boolean
  Hls?: (typeof import('hls.js'))['default']
  hlsjs?: Hls
}
