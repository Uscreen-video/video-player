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

  @connect("idle")
  @property({ type: Boolean, reflect: true })
  idle: boolean;

  @connect("isPlaying")
  @property({ type: Boolean, reflect: true })
  playing: boolean;

  @connect("isFullscreen")
  @property({ type: Boolean, reflect: true })
  fullscreen: boolean;

  @property({ type: Boolean, reflect: true })
  custom = false;

  render() {
    return html`<slot></slot>`;
  }
}
