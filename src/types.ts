import { device } from "./helpers/device";
import type Hls from "hls.js";

/**
 * Command are the actions that can be triggered by the user or a interface
 * They can be handled with the `@listen` decorator, and should not affect the state
 */
export enum Command {
  /** Play the video */
  play = "play",
  /** Pause the video */
  pause = "pause",
  /** Seek to a specific time */
  seek = "seek",
  /** Mute the video */
  mute = "mute",
  /** Unmute the video */
  unmute = "unmute",
  /** Set playback rate */
  setPlaybackRate = "setPlaybackRate",
  /** Toggle fullscreen mode */
  toggleFullscreen = "toggleFullscreen",
  /** Toggle play/pause */
  togglePlay = "togglePlay",
  /** Toggle mute/unmute */
  toggleMuted = "toggleMuted",
  /** Set the video volume */
  setVolume = "setVolume",
  /** Increase video volume */
  increaseVolume = "increaseVolume",
  /** Decrease video volume */
  decreaseVolume = "decreaseVolume",
  /** Seek forward for 10 seconds */
  forward = "forward",
  /** Seek backward for 10 seconds */
  backward = "backward",
  /** Enable a text track */
  enableTextTrack = "enableTextTrack",
  /** Enable an audio track */
  enableAudioTrack = "enableAudioTrack",
  /** Sets video quality */
  setQualityLevel = "setQualityLevel",
  /** Initialize the custom HLS player */
  initCustomHLS = "initCustomHLS",
  /** Initialize the video player */
  init = "init",
  /** Request to play via AirPlay on IOS/MacOs devices */
  requestAirplay = "requestAirplay",
  /** Triggers when ChromeCast is not supported in browser */
  castNotSupported = "castNotSupported",
  /** Request playing video on ChromeCast device */
  requestCast = "requestCast",
  /** Toggles "picture in picture" mode */
  togglePip = "togglePip",
  /** Toggles live mode */
  live = "live",
  /** Sets error */
  error = "error",
  /** Reloads the media source after a playback error */
  reload = "reload",
}

export enum Action {
  play = "play",
  pause = "pause",
  update = "update",
  toggleMuted = "toggleMuted",
  seekEnd = "seekEnd",
  seekStart = "seekStart",
  canPlay = "canPlay",
  updateDuration = "updateDuration",
  updateTime = "updateTime",
  init = "init",
  volumeChange = "volumeChange",
  fullscreenChange = "fullscreenChange",
  setLevels = "setLevels",
  interacted = "interacted",
  idle = "idle",
  selectTextTrack = "selectTextTrack",
  selectAudioTrack = "selectAudioTrack",
  cues = "cues",
  setPlaybackRate = "setPlaybackRate",
  setQualityLevel = "setQualityLevel",
  updateAirplayStatus = "updateAirplayStatus",
  toggleAirplay = "toggleAirplay",
  togglePip = "togglePip",
  setCastStatus = "setCastStatus",
  setBuffer = "setBuffer",
  setMuxParams = "setMuxParams",
  setVideoOffset = "setVideoOffset",
  live = "live",
  setDRMOptions = "setDRMOptions",
}

export enum Event {
  state = "video-state-update",
  bulk = "video-bulk-state-update",
  command = "video-command",
  registerCommand = "video-register-command",
}

/** Marketing label for the higher resolution tiers. Lower tiers get no badge. */
export type QualityBadge = "HD" | "2K" | "4K";

export type State = Partial<
  {
    value: number;
    duration: number;
    currentTime: number;
    src: string;
    sources: {
      type: string;
      src: string;
    }[];
    title: string;
    poster: string;
    volume: number;
    canPlay: boolean;
    played: boolean;
    idle: boolean;
    isInteracted: boolean;
    isPlaying: boolean;
    isMuted: boolean;
    isAutoplay: boolean;
    isSourceSupported: boolean;
    isFullscreen: boolean;
    activeTextTrackId: string;
    activeAudioTrackId: string;
    /** The quality level selected by the user. `-1` means automatic (ABR) selection. */
    activeQualityLevel: number;
    /** The height of the rendition currently being played, whatever selected it. */
    currentQualityLevel: number;
    playbackRate: number;
    customHLS: boolean;
    airplayAvailable: boolean;
    airplayActivated: boolean;
    pipAvailable: boolean;
    pipActivated: boolean;
    castAvailable: boolean;
    castActivated: boolean;
    cues: string[];
    buffered: number;
    textTracks: {
      label: string;
      src: string;
      lang: string;
      id: string;
    }[];
    audioTracks: {
      label: string;
      lang: string;
      id: string;
    }[];
    qualityLevels: {
      /** The height as a string — kept as the menu item value for compatibility */
      name: string;
      height: number;
      badge?: QualityBadge;
    }[];
    muxData: MuxParams;
    live: boolean;
    initialized: boolean;
    drmOptions?: DRMOptions;
    /** Where a viewer whose browser has no key system can read how to enable one */
    drmHelpUrl?: string;
  } & typeof device
>;

export type MuxParams = {
  env_key: string;

  /** any arbitrary string you want to use to identify this player */
  player_name?: string;
  player_init_time?: number;
  player_version?: string;

  viewer_user_id?: string;
  experiment_name?: string;

  video_id?: string;
  video_title?: string;
  video_series?: string;
  video_duration?: string;
  video_stream_type?: string;
  video_cdn?: string;
};

export type MuxOptions = {
  debug?: boolean;
  Hls?: (typeof import("hls.js"))["default"];
  hlsjs?: Hls;
};

export const enum KeySystems {
  clearkey = "org.w3.clearkey",
  fps = "com.apple.fps",
  playready = "com.microsoft.playready",
  widevine = "com.widevine.alpha",
}

/**
 * `no-access`: the browser has no usable key system (DRM disabled, in-app browser).
 * `license-refused`: the key system works, the license server refused the request.
 * `certificate-failed`: the FairPlay certificate could not be fetched.
 */
export type DRMFailureReason =
  | "no-access"
  | "license-refused"
  | "certificate-failed"
  | "unknown";

export type PlayerError = {
  /** Mirrors `MediaError.code` when the failure comes from the media element */
  code?: number;
  /** Technical reason of the failure, logged by the `player:commands` channel */
  message?: string;
  /** Set when the key system, and not the media element, has failed */
  drm?: boolean;
  reason?: DRMFailureReason;
  /** HTTP status of the license or certificate request, when one was made */
  status?: number;
  /** The engine's own error identifier, an hls.js `ErrorDetails` value */
  details?: string;
  keySystem?: string;
  /** Widevine CDM build, read out of the license challenge when present */
  cdmVersion?: string;
};

export type DRMSystemConfiguration = {
  licenseUrl: string;
  certificateUrl?: string;
};

export type DRMOptions = Partial<Record<KeySystems, DRMSystemConfiguration>>;
