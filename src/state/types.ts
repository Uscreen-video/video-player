export enum Command {
  play,
  pause,
  init,
}

export enum Action {
  play,
  pause,
  updateSource,
  toggleMuted
}

export enum Event {
  state = 'video-state-update',
  bulk = 'video-bulk-state-update',
  command = 'video-command',
  registerCommand = 'video-register-command',
}

export type State = Partial<{
  value: number,
  src: string,
  poster: string,
  isPlaying: boolean,
  isMuted: boolean,
  isAutoplay: boolean
  isNativeHLS: boolean
}>


export type PromiseLike = [
  resolve: (value: unknown) => void,
  reject: (value: unknown) => void
]
