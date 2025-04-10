import { unsafeCSS, LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import styles from "./Video-chromecast.styles.css?inline";
import { connect, createCommand, dispatch, listen } from "../../state";
import { Action, Command, State } from "../../types";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import _castIcon from "../../icons/chrome-cast-outline.svg?raw";
// import { CastStatus } from '../../types';
const castIcon = unsafeSVG(_castIcon);

const buildTrackId = (track: chrome.cast.media.Track) => {
  return `${track.name}-${track.language}`
}

@customElement("video-chromecast")
export class VideoChromecast extends LitElement {
  static styles = unsafeCSS(styles);
  public command = createCommand(this);
  private player: cast.framework.RemotePlayer;
  private controller: cast.framework.RemotePlayerController;
  private media: chrome.cast.media.Media;

  @connect("src")
  src: string;

  @connect("title")
  title: string;

  @connect("castActivated")
  @property({ type: Boolean, reflect: true })
  active: false;

  @connect("poster")
  poster: string;

  @connect("textTracks")
  cues: State["textTracks"];

  @connect("activeTextTrackId")
  activeTextTrackId: string;

  @connect("activeAudioTrackId")
  activeAudioTrackId: string;

  @state()
  targetDevice: string;

  @state()
  castStatus: 'DEFAULT' | 'ERROR' = 'DEFAULT';

  @listen(Command.togglePlay, { castActivated: true })
  @listen(Command.play, { castActivated: true })
  @listen(Command.pause, { castActivated: true })
  play() {
    this.controller.playOrPause();
  }

  @listen(Command.seek, { castActivated: true })
  seek({ time }: { time: number }) {
    this.player.currentTime = time;
    this.controller.seek();
  }

  @listen(Command.forward, { castActivated: true })
  forward() {
    this.player.currentTime = Math.min(
      this.player.currentTime + 10,
      this.player.duration,
    );
    this.controller.seek();
  }

  @listen(Command.backward, { castActivated: true })
  backward() {
    this.player.currentTime = Math.max(
      this.player.currentTime - 10,
      this.player.duration,
    );
    this.controller.seek();
  }

  @listen(Command.toggleMuted, { castActivated: true })
  @listen(Command.mute)
  mute() {
    this.controller?.muteOrUnmute();
  }

  @listen(Command.setVolume, { castActivated: true })
  setVolume({ volume }: { volume: number }) {
    this.player.volumeLevel = volume;
    this.controller.setVolumeLevel();
  }

  @listen(Command.increaseVolume, { castActivated: true })
  increaseVolume() {
    this.player.volumeLevel = this.player.volumeLevel + 0.1;
    this.controller.setVolumeLevel();
  }

  @listen(Command.decreaseVolume, { castActivated: true })
  decreaseVolume() {
    this.player.volumeLevel = this.player.volumeLevel - 0.1;
    this.controller.setVolumeLevel();
  }

  @listen(Command.enableTextTrack, { castActivated: true })
  handleCuesChange() {
    window.requestAnimationFrame(() => {
      this.requestTracksChange();
    })
  }

  @listen(Command.enableAudioTrack, { castActivated: true })
  handleAudioTrackChange() {
    window.requestAnimationFrame(() => {
      this.requestTracksChange();
    })
  }

  private requestTracksChange() {
    if (!this.media) return;

    const activeTextTrack = this.media.media.tracks.find((track) => track.type === window.chrome.cast.media.TrackType.TEXT && buildTrackId(track) === this.activeTextTrackId);

    const activeAudioTrack = this.media.media.tracks.find((track) => track.type === window.chrome.cast.media.TrackType.AUDIO && buildTrackId(track) === this.activeAudioTrackId);

    const activeTrackIDs = [activeTextTrack?.trackId, activeAudioTrack?.trackId].filter(i => !!i);

    const request = new window.chrome.cast.media.EditTracksInfoRequest(activeTrackIDs);
    this.media.editTracksInfo(request, void 0, void 0);
  }

  private shouldInitTracks = false

  @listen(Command.requestCast)
  async loadMedia() {
    const media = new window.chrome.cast.media.MediaInfo(
      this.src,
      "application/x-mpegurl",
    );

    media.metadata = new window.chrome.cast.media.GenericMediaMetadata();
    media.textTrackStyle = new window.chrome.cast.media.TextTrackStyle();
    media.textTrackStyle.backgroundColor = "#00000000";
    media.textTrackStyle.edgeColor = "#00000016";
    media.textTrackStyle.edgeType =
      window.chrome.cast.media.TextTrackEdgeType.DROP_SHADOW;
    media.textTrackStyle.fontFamily =
      window.chrome.cast.media.TextTrackFontGenericFamily.SANS_SERIF;
    media.textTrackStyle.fontScale = 1.0;
    media.textTrackStyle.foregroundColor = "#FFFFFF";

    media.metadata.title = this.title;
    media.metadata.images = [
      {
        url: this.poster,
      },
    ];

    const request = new window.chrome.cast.media.LoadRequest(media);

    try {
      await window.cast.framework.CastContext.getInstance().requestSession();

      const session =
        window.cast.framework.CastContext.getInstance().getCurrentSession();

      await session.loadMedia(request);

      this.updateDeviceName();

      this.shouldInitTracks = true;
      this.castStatus = 'DEFAULT';
    } catch (err) {
      console.error(err);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (window.cast) this.initChromeCast();
    else if (window.chrome) this.loadChromeCastFramework();
  }

  disconnectedCallback(): void {
    if (this.controller)
      Object.values(cast.framework.RemotePlayerEventType).forEach((event) =>
        this.controller.removeEventListener(event, this.handleCastEvent),
      );

    super.disconnectedCallback();
  }

  initChromeCast() {
    window.cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId:
        window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      resumeSavedSession: false,
    });

    this.player = new window.cast.framework.RemotePlayer();
    this.controller = new window.cast.framework.RemotePlayerController(
      this.player,
    );

    Object.values(cast.framework.RemotePlayerEventType).forEach((event) =>
      this.controller.addEventListener(event, this.handleCastEvent),
    );

    dispatch(this, Action.setCastStatus, { castAvailable: true });

    setTimeout(() => {
      if (this.active && !this.media) {
        this.castStatus = 'ERROR';
      }
    }, 500)
  }

  loadChromeCastFramework() {
    const existingScript = document.getElementById(
      "uscreen-player-chromecast-framework",
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src =
      "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
    script.id = "uscreen-player-chromecast-framework";
    script.addEventListener("load", () => this.handleChromeCastLoad(0));
    document.head.appendChild(script);
  }

  handleChromeCastLoad = (tries: number): void => {
    if (window.chrome?.cast?.isAvailable) {
      this.initChromeCast();
    } else {
      if (tries++ > 20) {
        dispatch(this, Action.setCastStatus, { castAvailable: false });
      } else {
        setTimeout(this.handleChromeCastLoad, 250, tries);
      }
    }
  };

  private updateDeviceName() {
    const session = window.cast.framework.CastContext.getInstance().getCurrentSession();

    const device = session?.getCastDevice();

    if (device) {
      this.targetDevice = device.friendlyName;
    }
  }

  handleCastEvent = ({
    field,
    value,
  }: cast.framework.RemotePlayerChangedEvent) => {
    switch (field) {
      case "mediaInfo":
        const session = window.cast.framework.CastContext.getInstance().getCurrentSession();
        const _media = session?.getMediaSession && session.getMediaSession();
        if (_media) {
          this.media = _media;
        }
        if (this.shouldInitTracks && value?.tracks?.length > 1) {
          this.shouldInitTracks = false;
          window.requestAnimationFrame(() => {
            this.requestTracksChange();
          })
        }
        break;
      case "displayName":
        this.updateDeviceName();
        break;
      case "isConnected":
        if (value) {
          this.command(Command.pause);
        }
        dispatch(this, Action.setCastStatus, { castActivated: value });
        break;
      case "playerState":
        dispatch(this, value === "PLAYING" ? Action.play : Action.pause);
        if (value === 'IDLE') {
          setTimeout(() => {
            if (this.media?.idleReason === 'ERROR') {
              this.castStatus = 'ERROR';
            }
            if (this.media?.idleReason === 'FINISHED') {
              const session = window.cast.framework.CastContext.getInstance().getCurrentSession();
              session.endSession(true);
            }
          }, 500)
        }
        break;
      case "currentTime":
        dispatch(this, Action.updateTime, { currentTime: value });
        break;
    }
  };

  render() {
    if (this.castStatus === 'ERROR') {
      return html` ${castIcon} <slot name="error">Error while loading media resource. Please restart cast.</slot>`;
    }

    return html` ${castIcon} <slot>Casting to</slot> "${this.targetDevice}"`
  }
}
