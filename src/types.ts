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
  castAvailable,
  setCastStatus,
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
  poster: string,
  volume: number,
  canPlay: boolean,
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
  castAvailable: boolean,
  castActivated: boolean,
  cues: string[],
  textTracks: {
    label: string,
    src: string,
    lang: string
  }[],
  qualityLevels: {
    name: string
  }[]
}>
