export enum Command {
  play,
  pause,
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
}>
