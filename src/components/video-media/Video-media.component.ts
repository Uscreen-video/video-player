import { adoptStyles, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import styles from "./Video-media.styles.css?inline";

export const MEDIA_CHANGE_EVENT = "video-media-change";

export type MediaChangeDetail = {
  video: HTMLVideoElement | null;
  previous?: HTMLVideoElement;
};

const PAGE_ONLY_ATTRIBUTE_RE = /^(id|class|style|slot|hidden|is|data-.*)$/;

const MEDIA_EVENTS = [
  "abort",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "ended",
  "error",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
  "enterpictureinpicture",
  "leavepictureinpicture",
  "webkitplaybacktargetavailabilitychanged",
  "webkitcurrentplaybacktargetiswirelesschanged",
];

const WRITABLE_DEFAULTS = {
  currentTime: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
  defaultPlaybackRate: 1,
};

const READ_ONLY_DEFAULTS = {
  duration: NaN,
  paused: true,
  ended: false,
  seeking: false,
  readyState: 0,
  networkState: 0,
  error: null as MediaError | null,
  currentSrc: "",
  videoWidth: 0,
  videoHeight: 0,
  buffered: undefined as TimeRanges | undefined,
  seekable: undefined as TimeRanges | undefined,
  played: undefined as TimeRanges | undefined,
  textTracks: undefined as TextTrackList | undefined,
};

type ProxiedProperty =
  | keyof typeof WRITABLE_DEFAULTS
  | keyof typeof READ_ONLY_DEFAULTS;

export interface VideoMedia extends Pick<HTMLVideoElement, ProxiedProperty> {}

/**
 * Describes a video in page markup and holds the real `<video>` in its shadow
 * root, only while it is in the document.
 *
 * `cloneNode` copies neither the shadow root nor the video. The video is built
 * in `connectedCallback` and nowhere else, because WebKit upgrades a detached
 * copy and runs its constructor.
 *
 * @fires video-media-change - The inner video was created or removed
 */
@customElement("video-media")
export class VideoMedia extends HTMLElement {
  video: HTMLVideoElement | null = null;

  private observer?: MutationObserver;

  connectedCallback() {
    if (this.video) return;
    this.createVideo();
  }

  disconnectedCallback() {
    // A move inside the document disconnects and reconnects in one task, and
    // the video has to survive it
    queueMicrotask(() => {
      if (!this.isConnected) this.removeVideo();
    });
  }

  play() {
    return this.video
      ? this.video.play()
      : Promise.reject(new DOMException("No video", "InvalidStateError"));
  }

  pause() {
    this.video?.pause();
  }

  load() {
    this.video?.load();
  }

  private createVideo() {
    const root = this.shadowRoot ?? this.attachStyledShadow();

    const video = this.ownerDocument.createElement("video");
    Array.from(this.attributes).forEach(({ name, value }) => {
      if (!PAGE_ONLY_ATTRIBUTE_RE.test(name)) video.setAttribute(name, value);
    });
    // The `muted` attribute mutes a video only when the parser creates it
    video.muted = this.hasAttribute("muted");
    this.copyTracks(video);
    MEDIA_EVENTS.forEach((type) =>
      video.addEventListener(type, this.redispatch),
    );

    root.append(video);
    this.video = video;

    this.observer = new MutationObserver(this.handleMutations);
    // `subtree` for the tracks: they are copied into the video, so an edit to
    // one of them — a renewed caption URL, a corrected language or label —
    // would otherwise never reach the copy
    this.observer.observe(this, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    this.emitChange({ video });
  }

  private attachStyledShadow() {
    const root = this.attachShadow({ mode: "open" });
    adoptStyles(root, [unsafeCSS(styles)]);
    return root;
  }

  private removeVideo() {
    const video = this.video;
    if (!video) return;

    this.video = null;
    this.observer?.disconnect();
    this.emitChange({ video: null, previous: video });

    MEDIA_EVENTS.forEach((type) =>
      video.removeEventListener(type, this.redispatch),
    );
    video.pause();
    video.removeAttribute("autoplay");
    video.removeAttribute("src");
    video.replaceChildren();
    video.load();
    video.remove();
  }

  /** The copies keep the order of the markup, so the match is by position */
  private syncTrack(track: HTMLTrackElement, attributeName: string) {
    const index = Array.from(this.querySelectorAll(":scope > track")).indexOf(
      track,
    );
    const copy = this.video?.querySelectorAll("track")[index];
    if (!copy) return;

    const value = track.getAttribute(attributeName);
    if (value === null) copy.removeAttribute(attributeName);
    else copy.setAttribute(attributeName, value);
  }

  private copyTracks(video: HTMLVideoElement) {
    video.querySelectorAll("track").forEach((track) => track.remove());
    this.querySelectorAll(":scope > track").forEach((track) =>
      video.append(track.cloneNode(true)),
    );
  }

  private handleMutations = (records: MutationRecord[]) => {
    const video = this.video;
    if (!video) return;

    records.forEach(({ type, target, attributeName, addedNodes, removedNodes }) => {
      if (type === "attributes") {
        // An attribute of a `<track>`, not of the host. Only that one copy is
        // patched: rebuilding them all would hand the player new `TextTrack`
        // objects with the same label and language, which it takes for the
        // ones it already listens to, and the selected captions stop updating
        if (target !== this) {
          if ((target as Element).nodeName === "TRACK")
            this.syncTrack(target as HTMLTrackElement, attributeName);
          return;
        }
        if (PAGE_ONLY_ATTRIBUTE_RE.test(attributeName)) return;
        const value = this.getAttribute(attributeName);
        if (value === null) video.removeAttribute(attributeName);
        else video.setAttribute(attributeName, value);
        return;
      }

      const tracksChanged = [...addedNodes, ...removedNodes].some(
        (node) => node.nodeName === "TRACK",
      );
      if (tracksChanged) this.copyTracks(video);
    });
  };

  private redispatch = (event: Event) => {
    const copy = new Event(event.type);
    if ("availability" in event) {
      Object.assign(copy, { availability: event.availability });
    }
    this.dispatchEvent(copy);
  };

  private emitChange(detail: MediaChangeDetail) {
    this.dispatchEvent(
      new CustomEvent(MEDIA_CHANGE_EVENT, { bubbles: true, detail }),
    );
  }
}

const proxy = (name: ProxiedProperty, fallback: unknown, writable: boolean) =>
  Object.defineProperty(VideoMedia.prototype, name, {
    configurable: true,
    get(this: VideoMedia) {
      return this.video ? this.video[name] : fallback;
    },
    set: writable
      ? function (this: VideoMedia, value: never) {
          if (this.video) (this.video[name] as unknown) = value;
        }
      : undefined,
  });

Object.entries(WRITABLE_DEFAULTS).forEach(([name, fallback]) =>
  proxy(name as ProxiedProperty, fallback, true),
);
Object.entries(READ_ONLY_DEFAULTS).forEach(([name, fallback]) =>
  proxy(name as ProxiedProperty, fallback, false),
);
