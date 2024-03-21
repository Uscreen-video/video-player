import { unsafeCSS, LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import styles from "./Video-progress.styles.css?inline";
import { ifDefined } from "lit/directives/if-defined.js";

@customElement("video-progress")
export class VideoProgress extends LitElement {
  static styles = unsafeCSS(styles);

  /**
   * The current value of the progress bar.
   * Should be a number between 0 and 100.
   */
  @property({ type: Number })
  value = 0;

  /**
   * Indicates whether the progress bar is in a loading state.
   */
  @property({ type: Boolean })
  loading = false;

  render() {
    const value = Math.min(Math.max(Number(this.value), 0), 100).toFixed(3);
    return html`
      <progress
        min="0"
        max="100"
        value=${ifDefined(this.loading ? undefined : value)}
        role="progressbar"
        area-hidden="true"
        ?inactive=${this.value <= 0}
      >
        <slot></slot>
      </progress>
    `;
  }
}
