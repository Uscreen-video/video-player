import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "lit/decorators.js";
import { connect, Types } from "../../state";
import { VideoButton } from "../video-button";

import _airplayIcon from "../../icons/airplay-outline.svg?raw";
const airplayIcon = unsafeSVG(_airplayIcon);

@customElement("video-airplay-button")
export class AirplayButton extends VideoButton {
  @connect("airplayAvailable")
  airplayAvailable: boolean;

  @connect("airplayActivated")
  airplayActivated: boolean;

  override handleClick() {
    this.command(Types.Command.requestAirplay);
  }

  override renderContent() {
    if (!this.airplayAvailable) return null;
    return html`
      <slot name="icon:${this.airplayActivated ? "enabled" : "disabled"}">
        ${airplayIcon}
      </slot>
    `;
  }

  override renderTooltip() {
    return html`
      <span slot="tooltip:${this.airplayActivated ? "enabled" : "disabled"}">
        ${this.airplayActivated ? "Disable Airplay" : "Enable Airplay"}
      </span>
    `;
  }
}
