import { connect } from "../../state";
import { unsafeCSS, LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { DependentPropsMixin } from "../../mixins/DependentProps";
import styles from "./Video-controls.styles.css?inline";

/**
 * @slot - Video-controls main content
 * */
@customElement("video-controls")
export class VideoControls extends DependentPropsMixin(LitElement) {
  static styles = unsafeCSS(styles);

  /**
   * Indicates whether the video player is in idle mode.
   */
  @connect("idle")
  @property({ type: Boolean, reflect: true })
  idle: boolean;

  /**
   * Indicates whether the video is currently playing.
   */
  @connect("isPlaying")
  @property({ type: Boolean, reflect: true })
  playing: boolean;

  /**
   * Indicates whether the video player is in fullscreen mode.
   */
  @connect("isFullscreen")
  @property({ type: Boolean, reflect: true })
  fullscreen: boolean;

  /**
   * Indicates whether the video controls are customized.
   * If true, the controls are custom; if false, they are default.
   */
  @property({ type: Boolean, reflect: true })
  custom = false;

  render() {
    return html`<slot></slot>`;
  }
}
