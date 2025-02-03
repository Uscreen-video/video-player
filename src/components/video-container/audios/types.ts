export type AudiosController = {
  enableAudioTrack: (id: string) => void;
}

export type AudioTrack = {
  id: string;
  label: string;
  language: string;
  enabled: boolean;
}

export type VideoElementWithAudioTracks = HTMLVideoElement & { audioTracks: AudioTrack[] & { addEventListener: (event: string, listener: () => void) => void } }