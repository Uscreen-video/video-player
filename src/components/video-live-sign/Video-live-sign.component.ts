import { unsafeCSS, LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import styles from "./Video-live-sign.styles.css?inline";
import { createCommand, connect, dispatch, Types } from "../../state";

@customElement("video-live-sign")
export class VideoLiveSign extends LitElement {
  static styles = unsafeCSS(styles);

  /**
   * Indicates whether the video stream is live.
   */
  @connect("live")
  live: boolean;

  command = createCommand(this);

  private onClick = () => {
    if (!this.live) {
      this.command(Types.Command.live);
    }
  };

  firstUpdated(): void {
    dispatch(this, Types.Action.live, { live: true });
    this.addEventListener("click", this.onClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.onClick);
  }

  render() {
    return html`
      <div
        class=${classMap({ live: !!this.live, sign: true })}
        part="sign"
      ></div>
      <slot>Live</slot>
    `;
  }
}
