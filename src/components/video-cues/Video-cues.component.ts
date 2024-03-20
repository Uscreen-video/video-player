import { unsafeCSS, LitElement } from "lit";
import { unsafeStatic, html } from "lit/static-html.js";
import { customElement, property } from "lit/decorators.js";
import styles from "./Video-cues.styles.css?inline";
import { connect } from "../../state";

@customElement("video-cues")
export class VideoCues extends LitElement {
  static styles = unsafeCSS(styles);

  /**
   * Indicates whether the video player is in idle mode.
   */
  @connect("idle")
  @property({ type: Boolean, reflect: true })
  idle: boolean;

  /**
   * The currently active text track (e.g., subtitles or captions).
   */
  @connect("activeTextTrack")
  activeTextTrack: string;

  /**
   * An array of cues or subtitles to be displayed during video playback.
   */
  @connect("cues")
  cues: string[];

  /**
   * Indicates whether the device is an iOS device.
   */
  @connect("isIos")
  @property({ type: Boolean, reflect: true, attribute: "is-ios" })
  isIos: true;

  /**
   * Indicates whether the video player is in fullscreen mode.
   */
  @connect("isFullscreen")
  isFullscreen: false;

  render() {
    if ((this.isIos && this.isFullscreen) || !this.activeTextTrack) return null;

    return this.cues.map(
      (cue) => html`
        <div class="cue">
          <span>${unsafeStatic(cue)}</span>
        </div>
      `,
    );
  }
}
