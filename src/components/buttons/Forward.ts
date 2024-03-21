import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "lit/decorators.js";
import { Types } from "../../state";
import { VideoButton } from "../video-button";

import _forwardIcon from "../../icons/forward-solid.svg?raw";

const forwardIcon = unsafeSVG(_forwardIcon);

@customElement("video-forward-button")
export class ForwardButton extends VideoButton {
  override handleClick() {
    this.command(Types.Command.forward);
  }

  override renderContent() {
    return html`<slot name="icon">${forwardIcon}</slot>`;
  }

  override renderTooltip() {
    return html`<slot name="tooltip">Forward</slot>`;
  }
}
