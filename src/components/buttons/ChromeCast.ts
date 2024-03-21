import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "lit/decorators.js";
import { connect, Types } from "../../state";
import { VideoButton } from "../video-button";

import _castIcon from "../../icons/chrome-cast-outline.svg?raw";
const castIcon = unsafeSVG(_castIcon);

@customElement("video-chromecast-button")
export class ChromeCastButton extends VideoButton {
  @connect("castAvailable")
  available: boolean;

  @connect("castActivated")
  activated: boolean;

  override handleClick() {
    this.command(Types.Command.requestCast);
  }

  override renderContent() {
    if (!this.available) return null;
    return html`
      <slot name="icon:${this.activated ? "enabled" : "disabled"}">
        ${castIcon}
      </slot>
    `;
  }

  override renderTooltip() {
    return html`
      <slot name="tooltip:${this.activated ? "enabled" : "disabled"}">
        ${this.activated ? "Disable Cast" : "Enable Chrome Cast"}
      </slot>
    `;
  }
}
