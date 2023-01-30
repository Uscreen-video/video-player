export enum Command {
  play,
  pause,
  init,
  seek,
  initCustomHLS,
}

export enum Action {
  play,
  pause,
  update,
  toggleMuted,
  seekEnd,
  seekStart,
  canPlay
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
  canPlay: boolean,
  isPlaying: boolean,
  isMuted: boolean,
  isAutoplay: boolean
  isNativeHLS: boolean
}>


export type PromiseLike = [
  resolve: (value: unknown) => void,
  reject: (value: unknown) => void
]
