import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement, property } from "lit/decorators.js";
import { connect, Types } from "../../state";
import { VideoButton } from "../video-button";
import { State } from "../../types";
import solidIcon from "../../icons/subtitles-solid.svg?raw";
import outlineIcon from "../../icons/subtitles-outline.svg?raw";
import checkIcon from "../../icons/checkmark.svg?raw";

import "../video-menu";

const icons = {
  outline: unsafeSVG(outlineIcon),
  solid: unsafeSVG(solidIcon),
  check: unsafeSVG(checkIcon),
};

@customElement("video-subtitles-button")
export class SubtitlesButton extends VideoButton {
  @connect("activeTextTrackId")
  activeTrackId: string;

  @connect("textTracks")
  textTracks: State["textTracks"];

  @property({ type: Object })
  translation: Record<string, string> = {};

  override handleClick = () => {
    if (this.menuPopper) return this.destroyMenu();
    this.destroyTooltip();
    this.createMenu();
    document.addEventListener("click", this.removeMenu);
  };

  override renderContent() {
    if (!this.textTracks?.length) return null;

    return html`
      <slot name="icon:${this.activeTrackId ? "enabled" : "disabled"}">
        ${this.activeTrackId ? icons.solid : icons.outline}
      </slot>
    `;
  }

  override renderTooltip() {
    return html` <slot name="tooltip"> Subtitles </slot> `;
  }

  override renderMenu = () => {
    return html`
      <slot name="menu">
        <video-menu
          @menu-item-click=${this.handleItemClick}
          .items=${this.translateLabels(this.getMenuItems)}
        >
        </video-menu>
      </slot>
    `;
  };

  translateLabels(items: any[]) {
    return items.map((i: any) => {
      if (!this.translation[i.label]) return i;
      i.label = this.translation[i.label];
      return i;
    });
  }

  removeMenu = (e?: PointerEvent) => {
    if (!e || e.target !== this) {
      this.destroyMenu();
      document.removeEventListener("click", this.removeMenu);
    }
  };

  handleItemClick = (e: any) => {
    const trackId = e.detail.value;
    this.command(Types.Command.enableTextTrack, {
      trackId: trackId === "off" ? "" : trackId,
    });
    this.removeMenu();
  };

  get getMenuItems(): any {
    const active = this.activeTrackId || "off";
    return [{ label: "Off", lang: "", id: "off" }, ...(this.textTracks || [])].map(
      (track) => ({
        ...track,
        value: track.id,
        isActive: active === track.id,
        iconAfter: active === track.id ? icons.check : null,
      }),
    );
  }
}
