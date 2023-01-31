export enum Command {
  play,
  pause,
  init,
  seek,
  initCustomHLS,
  mute,
  unmute,
  toggleFullscreen
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
  fullscreenChange
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
  isPlaying: boolean,
  isMuted: boolean,
  isAutoplay: boolean
  isNativeHLS: boolean,
  isFullscreen: boolean
}>


export type PromiseLike = [
  resolve: (value: unknown) => void,
  reject: (value: unknown) => void
]
