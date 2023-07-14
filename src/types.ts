import { device } from "./helpers/device"
import type Hls from 'hls.js'

/**
 * Command are the actions that can be triggered by the user or a interface
 * They can be handled with the `@listen` decorator, and should not affect the state
 */
export enum Command {
  /** Play the video */
  play,
  /** Pause the video */
  pause,
  /** Seek to a specific time */
  seek,
  /** Mute the video */
  mute,
  /** Unmute the video */
  unmute,
  /** Set playback rate */
  setPlaybackRate,
  /** Toggle fullscreen mode */
  toggleFullscreen,
  /** Toggle play/pause */
  togglePlay,
  /** Toggle mute/unmute */
  toggleMuted,
  /** Set the video volume */
  setVolume,
  /** Increase video volume */
  increaseVolume,
  /** Decrease video volume */
  decreaseVolume,
  /** Seek forward for 10 seconds */
  forward,
  /** Seek backward for 10 seconds */
  backward,
  /** Enable a text track */
  enableTextTrack,
  /** Sets video quality */
  setQualityLevel,
  /** Initialize the custom HLS player */
  initCustomHLS,
  /** Initialize the video player */
  init,
  /** Request to play via AirPlay on IOS/MacOs devices */
  requestAirplay,
  /** Triggers when ChromeCast is not supported in browser */
  castNotSupported,
  /** Request playing video on ChromeCast device */
  requestCast,
  /** Toggles "picture in picture" mode */
  togglePip,
}

export enum Action {
  play,
  pause,
  update,
  toggleMuted,
  seekEnd,
  seekStart,
  canPlay,
  updateDuration,
  updateTime,
  init,
  volumeChange,
  fullscreenChange,
  setLevels,
  interacted,
  idle,
  selectTextTrack,
  cues,
  setPlaybackRate,
  setQualityLevel,
  updateAirplayStatus,
  toggleAirplay,
  togglePip,
  castAvailable,
  setCastStatus,
  setBuffer,
  setMuxParams,
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
