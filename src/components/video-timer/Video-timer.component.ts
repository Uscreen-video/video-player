import { unsafeCSS, LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import styles from "./Video-timer.styles.css?inline";
import { connect } from "../../state";
import { timeAsString } from "../../helpers/time";

@customElement("video-timer")
export class VideoTimer extends LitElement {
  static styles = unsafeCSS(styles);

  @property()
  format: "left" | "past" | "total" = "left";

  @connect("duration")
  duration: number;

  @connect("currentTime")
  currentTime: number;

  get time() {
    if (this.format === "left") return this.duration - this.currentTime;
    if (this.format === "past") return this.currentTime;
    return this.duration;
  }

  render() {
    return html` ${timeAsString(this.time)} `;
  }
}
