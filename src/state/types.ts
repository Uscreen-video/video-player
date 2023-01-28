export enum Command {
  play,
  pause,
}

export enum Action {
  toggle,
  play,
  pause
}

export enum Event {
  state = 'video-state-update',
  bulk = 'video-bulk-state-update',
  command = 'video-command',
  register = 'video-register-root',
}

export type State = {
  value: number,
  isPlaying: boolean,
}
