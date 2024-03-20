import { unsafeCSS, LitElement, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import styles from "./Video-timeline.styles.css?inline";
import { connect, createCommand } from "../../state";
import { Command } from "../../types";
import { DependentPropsMixin } from "../../mixins/DependentProps";
import { timeAsString } from "../../helpers/time";
import { VideoSlider } from "../video-slider";
import { classMap } from "lit/directives/class-map.js";
import { map } from "lit/directives/map.js";
import { watch } from "../../decorators/watch";
import { when } from "lit/directives/when.js";

import "../video-progress";
import "../video-slider";

const segmentConverter = (v: string) => {
  const values = v
    .split(",")
    .map(Number)
    .sort((a, b) => a - b);
  return values[0] ? [0, ...values] : values;
};

/**
 * @slot - Video-timeline main content
 * */
@customElement("video-timeline")
export class VideoTimeline extends DependentPropsMixin(LitElement) {
  static styles = unsafeCSS(styles);
  public command = createCommand(this);

  /**
   * Indicates whether the video timeline is disabled or not.
   */
  @property({ type: Boolean })
  disabled = false;

  /**
   * The segments property provides a flexible
   * mechanism for dividing the video timeline into distinct segments,
   * enabling enhanced visualization and navigation of the video content
   * based on different temporal divisions or events.
   */
  @property({ type: Array, converter: segmentConverter })
  segments: number[] = [0];

  @connect("live")
  live: boolean;

  @connect("duration")
  duration: number = 0;

  @connect("buffered")
  buffered: number;

  @connect("canPlay")
  canPlay: boolean;

  @connect("isFullscreen")
  @property({ type: Boolean, reflect: true })
  fullscreen: boolean;

  @property({ type: Boolean, attribute: "full-width", reflect: true })
  fullWidth = false;

  @query("video-slider")
  sliderNode: VideoSlider;

  @connect("currentTime")
  @state()
  currentTime = 0;

  @state()
  currentValue = 0;

  @state()
  isHovering = false;

  @state()
  hoverText = "";

  @state()
  isChanging?: boolean;

  @state()
  isPendingUpdate?: boolean;

  @state()
  hoverPosition = -1;

  @watch("currentTime")
  handleTimeChange() {
    if (this.isChanging) return;
    if (this.isPendingUpdate) {
      setTimeout(() => {
        this.isPendingUpdate = false;
      }, 200);
      return;
    }
    this.currentValue = this.currentTime;
  }

  handleInput(e: InputEvent & { currentTarget: VideoSlider }) {
    this.currentValue = e.currentTarget.currentValue;
    this.isChanging = this.isPendingUpdate = true;
  }

  handleChanged(e: { detail: { value: number } }) {
    const time = e.detail.value;
    this.command(Command.seek, { time });
    this.isChanging = false;
  }

  handleHover = (
    e: CustomEvent & { target: VideoSlider; detail: { position: number } },
  ) => {
    this.isHovering = true;
    const hoveredTime = this.duration * (e.detail.position / 100);
    this.hoverPosition = hoveredTime;
    const text = timeAsString(hoveredTime);
    if (text === this.hoverText) return;
    this.hoverText = text;
  };

  handleHoverEnd = () => {
    this.isHovering = false;
  };

  render() {
    const disabled = this.disabled || !this.canPlay;
    return html`
      <video-slider
        with-tooltip
        .value=${this.currentValue}
        .max=${this.duration}
        .valueText="${timeAsString(this.currentValue)} of ${timeAsString(
          this.duration,
        )}"
        .tooltipText="${this.isHovering
          ? this.hoverText
          : timeAsString(this.currentValue)}"
        ?disabled=${disabled}
        ?full=${this.live}
        ?loading=${!this.canPlay}
        @changed=${this.handleChanged}
        @hovering=${this.handleHover}
        @hoverend=${this.handleHoverEnd}
        @input=${this.handleInput}
      >
        ${when(!this.disabled, this.renderBars)}
        <slot name="tooltip" slot="tooltip"></slot>
      </video-slider>
      <slot></slot>
    `;
  }

  renderBars = () => {
    const sliderLength = 100 / this.sliderNode?.clientWidth;
    const segmentShift = sliderLength * 2;
    const thumbSift =
      (((sliderLength * 16) / 2) *
        (50 - (100 / this.duration) * this.currentValue)) /
      50;
    const duration = this.duration || 1;

    return html`
      <div class="progress-container" part="progress-container">
        ${map(this.segments, (segment, index) => {
          const next = this.segments[index + 1] || duration;
          const length = next - segment;
          return html`
            <div
              style="--width: ${(100 / duration) * length}%"
              class="${classMap({
                fraction: true,
                active:
                  this.hoverPosition < next && this.hoverPosition > segment,
              })}"
            >
              <video-progress
                class="buffered"
                .value=${(100 / length) * (this.buffered - segment) -
                segmentShift * index}
              ></video-progress>
              <video-progress
                class="progress"
                .value=${(100 / length) * (this.currentValue - segment) -
                segmentShift * index +
                thumbSift}
              ></video-progress>
            </div>
          `;
        })}
      </div>
    `;
  };
}
