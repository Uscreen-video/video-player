export enum Command {
  play,
  pause,
  init,
  seek,
  initCustomHLS,
  mute,
  unmute,
  toggleFullscreen,
  togglePlay,
  toggleMuted,
  setVolume,
  increaseVolume,
  decreaseVolume,
  forward,
  backward,
  enableTextTrack
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
  selectTextTrack
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
  activeQuality: string,
  textTracks: {
    label: string,
    src: string,
    lang: string
  }[],
  qualityLevels: {
    name: string
  }[]
}>
