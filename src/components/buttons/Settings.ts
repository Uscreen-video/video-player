import { html } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement, property, state } from "lit/decorators.js";
import { connect, Types } from "../../state";
import { VideoButton } from "../video-button";
import _settingsIcon from "../../icons/settings-solid.svg?raw";
import _checkmarkIcon from "../../icons/checkmark.svg?raw";
import _chevronIcon from "../../icons/chevron-left.svg?raw";
import "../video-menu";
import type { VideoMenu } from "../video-menu";
import { emit } from "../../helpers/event";
import { qualityLabel } from "../../helpers/quality";

const icons = {
  settings: unsafeSVG(_settingsIcon),
  check: unsafeSVG(_checkmarkIcon),
  chevron: unsafeSVG(_chevronIcon),
};

type Menu = "shortcuts" | "rate" | "quality" | "audio";

/** Appends the HD/2K/4K marketing badge as a superscript, when there is one. */
const withBadge = (label: string, badge?: string) =>
  badge ? html`${label}<sup class="badge">${badge}</sup>` : label;

@customElement("video-settings-button")
export class SubtitlesButton extends VideoButton {
  @property({
    type: Array,
    converter: (v) => v.split(",").map((v) => v.trim()),
  })
  settings: Menu[] = ["shortcuts", "rate", "quality", "audio"];

  @property({ type: Object })
  translation: Record<string, any> = {};

  @connect("playbackRate")
  playbackRate: number;

  @connect("activeQualityLevel")
  qualityLevel: number;

  @connect("currentQualityLevel")
  currentQualityLevel: number;

  @connect("qualityLevels")
  qualityLevels: Types.State["qualityLevels"];

  @connect("audioTracks")
  audioTracks: Types.State["audioTracks"];

  @connect("activeAudioTrackId")
  activeAudioTrackId: Types.State["activeAudioTrackId"];

  @state()
  activeMenu: Menu;

  connectedCallback() {
    super.connectedCallback();
    if (this.isSingleMenuItem) {
      this.activeMenu = this.settings[0];
    }
  }

  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  shortcuts = [
    {
      label: "Play/Pause",
      value: "toggle-play",
      iconAfter: html`<code>Space</code>`,
    },
    {
      label: "Enter fullscreen",
      value: "enter-fullscreen",
      iconAfter: html`<code>Enter</code>`,
    },
    {
      label: "Exit fullscreen",
      value: "exit-fullscreen",
      iconAfter: html`<code>Esc</code>`,
    },
    {
      label: "Rewind",
      value: "rewind",
      iconAfter: html`<code>←</code><code>→</code>`,
    },
    {
      label: "Change volume",
      value: "volume",
      iconAfter: html`<code>↓</code><code>↑</code>`,
    },
    {
      label: "Mute",
      value: "mute",
      iconAfter: html`<code>M</code>`,
    },
  ];

  override handleClick = () => {
    if (this.menuPopper) return this.destroyMenu();
    this.destroyTooltip();
    this.createMenu();
    document.addEventListener("click", this.removeMenu);
  };

  override renderContent() {
    return html` <slot name="icon"> ${icons.settings} </slot> `;
  }

  override renderTooltip() {
    return html`<slot name="tooltip">Settings</slot>`;
  }

  override renderMenu = () => {
    return html`
      <slot name="menu">
        <video-menu
          title=${this.selectedMenuLabel}
          @menu-item-click=${this.handleItemClick}
          .items=${this.translateLabels(this.renderMenuItems())}
        >
        </video-menu>
      </slot>
    `;
  };

  removeMenu = (e?: PointerEvent) => {
    if (!e || e.target !== this) {
      this.destroyMenu();
      this.selectMenu();
      document.removeEventListener("click", this.removeMenu);
    }
  };

  handleItemClick = ({ detail }: CustomEvent<{ value: any }>) => {
    const value = detail.value;
    if (value === "back") return this.selectMenu();
    switch (this.activeMenu) {
      case "rate":
        return this.selectRate(value);
      case "quality":
        return this.setQuality(value);
      case "audio":
        return this.selectAudio(value);
      default:
        return this.selectMenu(value);
    }
  };

  translateLabels(items: any[]) {
    return items.map((i: any) => {
      if (!this.translation[i.value]) return i;
      return {
        ...i,
        label: this.translation[i.value],
      };
    });
  }

  renderMenuItems = (): any => {
    switch (this.activeMenu) {
      case "rate":
        return this.rateMenuItems;
      case "shortcuts":
        return this.shortcutsMenuItems;
      case "quality":
        return this.qualityMenuItems;
      case "audio":
        return this.audioMenuItems;
      default:
        return this.mainMenuItems;
    }
  };

  selectRate = (playbackRate: number) => {
    this.command(Types.Command.setPlaybackRate, { playbackRate });
    this.removeMenu();
  };

  setQuality = (level: string) => {
    this.command(Types.Command.setQualityLevel, { level: Number(level) });
    this.removeMenu();
  };

  selectAudio = (id: string) => {
    this.command(Types.Command.enableAudioTrack, { trackId: id });
    this.removeMenu();
  };

  selectMenu(menu?: Menu) {
    this.activeMenu = this.isSingleMenuItem ? this.settings[0] : menu;

    // We need to trigger resize event to update the menu position
    Promise.resolve().then(() => emit(this, "resize"));
  }

  get isSingleMenuItem() {
    return this.settings.length === 1;
  }

  /** The rendition currently playing, as listed in the menu. */
  get currentLevel() {
    return this.qualityLevels?.find(
      (level) => level.height === this.currentQualityLevel,
    );
  }

  /**
   * "Auto" on its own until a rendition is playing, then "Auto (1080p HD)" so
   * it is clear what automatic selection has settled on.
   */
  get autoQualityLabel() {
    const auto = this.translation.auto || "Auto";
    const level = this.currentLevel;
    if (!level) return auto;
    return html`${auto} (${withBadge(qualityLabel(level.height), level.badge)})`;
  }

  /** The value shown next to "Quality" in the parent menu. */
  get qualitySummary() {
    if (this.qualityLevel === -1) return this.autoQualityLabel;
    const level = this.qualityLevels?.find(
      (l) => l.height === this.qualityLevel,
    );
    return withBadge(qualityLabel(this.qualityLevel), level?.badge);
  }

  get rateMenuItems(): any {
    const items = this.playbackRates.map((rate) => ({
      label: `${rate}x`,
      value: rate,
      iconAfter: this.playbackRate === rate ? icons.check : undefined,
      isActive: this.playbackRate === rate,
    }));
    if (this.isSingleMenuItem) return items;
    return [
      {
        label: "back",
        iconBefore: icons.chevron,
        value: "back",
      },
      ...items,
    ];
  }

  get mainMenuItems() {
    const menu: VideoMenu["items"] = [];
    if (this.settings.includes("shortcuts"))
      menu.push({
        label: "Shortcuts",
        value: "shortcuts",
      });
    if (this.settings.includes("rate"))
      menu.push({
        label: "Playback Rate",
        value: "rate",
        iconAfter: `${this.playbackRate}x`,
      });

    if (
      this.settings.includes("audio") &&
      this.audioTracks?.length &&
      this.activeAudioTrackId
    ) {
      menu.push({
        label: "Audio",
        value: "audio",
        iconAfter: this.audioTracks.find(
          (t) => t.id === this.activeAudioTrackId,
        )?.label,
      });
    }

    if (this.settings.includes("quality") && this.qualityLevels?.length)
      menu.push({
        label: "Quality",
        value: "quality",
        iconAfter: this.qualitySummary,
      });

    return menu;
  }

  get selectedMenuLabel() {
    if (!this.activeMenu || !this.isSingleMenuItem) return "";
    // The entry is absent until its tracks/levels have loaded
    return (
      this.mainMenuItems.find((m) => m.value === this.activeMenu)?.label || ""
    );
  }

  get shortcutsMenuItems(): any {
    if (this.isSingleMenuItem) return this.shortcuts;
    return [
      {
        label: "back",
        iconBefore: icons.chevron,
        value: "back",
      },
      ...this.shortcuts,
    ];
  }

  get qualityMenuItems(): any {
    const isAuto = this.qualityLevel === -1;
    const items = [
      {
        label: this.autoQualityLabel,
        iconAfter: isAuto ? icons.check : undefined,
        isActive: isAuto,
        value: -1,
      },
      ...(this.qualityLevels || []).map((level) => ({
        label: withBadge(qualityLabel(level.height), level.badge),
        value: level.name,
        iconAfter: this.qualityLevel === level.height ? icons.check : undefined,
        isActive: this.qualityLevel === level.height,
      })),
    ];
    if (this.isSingleMenuItem) return items;
    return [
      {
        label: "back",
        iconBefore: icons.chevron,
        value: "back",
      },
      ...items,
    ];
  }

  get audioMenuItems(): any {
    const items = (this.audioTracks || []).map((track) => ({
      label: track.label,
      value: track.id,
      iconAfter: this.activeAudioTrackId === track.id ? icons.check : undefined,
      isActive: this.activeAudioTrackId === track.id,
    }));
    if (this.isSingleMenuItem) return items;
    return [
      {
        label: "back",
        iconBefore: icons.chevron,
        value: "back",
      },
      ...items,
    ];
  }
}
