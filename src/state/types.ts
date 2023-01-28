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
  command = 'video-command',
  register = 'video-register-root',
}
