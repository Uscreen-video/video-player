import { unsafeCSS, LitElement, html, PropertyValueMap } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import styles from "./Video-slider.styles.css?inline";
import { emit } from "../../helpers/event";
import { watch } from "../../decorators/watch";
import {
  createPopper,
  Instance as PopperInstance,
  VirtualElement,
} from "@popperjs/core";
import { closestElement } from "../../helpers/closest";
import { when } from "lit/directives/when.js";
import { isDeepAssigned } from "../../helpers/slot";

type CombinedEventType = PointerEvent &
  TouchEvent & { target: HTMLInputElement };

const generateGetBoundingClientRect =
  (x = 0, y = 0) =>
  () =>
    new DOMRect(x, y, 0, 0);

@customElement("video-slider")
export class VideoSlider extends LitElement {
  static styles = unsafeCSS(styles);

  /**
   * The current value of the slider
   */
  @property({ type: Number })
  value = 0;

  /**
   * The maximum value allowed on the slider
   */
  @property({ type: Number })
  max = 1;

  /**
   * Indicates whether the slider is disabled.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Indicates whether the slider should take up full width.
   */
  @property({ type: Boolean, reflect: true })
  full = false;

  /**
   * Indicates whether the slider is in a loading state.
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * Text to display as the value of the slider.
   */
  @property({ attribute: "value-text" })
  valueText = "";

  /**
   * Text to display in the tooltip.
   */
  @property({ attribute: "tooltip-text" })
  tooltipText = "";

  /**
   * Determines whether the slider should have a tooltip.
   */
  @property({ type: Boolean, attribute: "with-tooltip" })
  withTooltip = false;

  /**
   * Offset for positioning the tooltip relative to the slider.
   */
  @property({ type: Number, attribute: "tooltip-offset" })
  tooltipOffset = -11;

  @property({ type: Boolean, reflect: true, attribute: "hovered" })
  isHovered = false;

  @state()
  currentValue?: number;

  @state()
  hasCustomTooltip = false;

  hoverPosition = "0";

  @query(".tooltip")
  tooltip: HTMLElement;

  @query(".slider")
  slider: HTMLInputElement;

  isChanging = false;
  isPendingUpdate = false;

  tooltipPopper: PopperInstance;
  overTimeout: number;

  virtualPopper: VirtualElement;

  @watch("value")
  handleValueChange() {
    this.currentValue = this.value;
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    if (!this.withTooltip) return;
    this.tooltipPopper?.destroy();
    this.addEventListener("mouseover", this.handlePointerOver);
    this.addEventListener("mouseleave", this.handlePointerLeave);
    this.addEventListener("mousemove", this.handlePointerMove);
    this.addEventListener("touchstart", this.handlePointerOver);
    this.addEventListener("touchend", this.handlePointerLeave);
    this.addEventListener("touchmove", this.handlePointerMove);
  }

  disconnectedCallback(): void {
    this.tooltipPopper?.destroy();
    this.removeEventListener("mouseover", this.handlePointerOver);
    this.removeEventListener("mouseleave", this.handlePointerLeave);
    this.removeEventListener("mousemove", this.handlePointerMove);
    this.removeEventListener("touchstart", this.handlePointerOver);
    this.removeEventListener("touchend", this.handlePointerLeave);
    this.removeEventListener("touchmove", this.handlePointerMove);
    super.disconnectedCallback();
  }

  handleInput(e: InputEvent & { target: HTMLInputElement }) {
    this.currentValue = this.max * (Number.parseFloat(e.target.value) / 100);
    emit(this, "inputing", { value: this.currentValue })
  }

  handleChange() {
    emit(this, "changed", { value: this.currentValue });
  }

  handlePointerOver(e: CombinedEventType) {
    if (!this.withTooltip || this.disabled) return;

    const [x, y, percents] = this.getCursorPosition(e);
    this.isHovered = true;
    this.hoverPosition = percents;
    this.tooltipPopper = this.createPopper(this.tooltip);
    this.virtualPopper.getBoundingClientRect = generateGetBoundingClientRect(
      x,
      y,
    );

    if (this.overTimeout) {
      window.clearTimeout(this.overTimeout);
    }

    this.overTimeout = setTimeout(() => {
      if (!this.isHovered || !this.matches(":hover")) return;
      this.tooltipPopper?.destroy();
      emit(this, "hoverend");
      this.isHovered = false;
    }, 5000);

    emit(this, "hovering", { position: percents });
  }

  handlePointerLeave() {
    if (!this.withTooltip) return;
    this.tooltipPopper?.destroy();
    emit(this, "hoverend");
    this.isHovered = false;
  }

  handlePointerMove = (e: CombinedEventType) => {
    window.clearTimeout(this.overTimeout);
    if (!this.withTooltip || !this.isHovered) return;
    const [x, y, percents] = this.getCursorPosition(e);

    if (percents === this.hoverPosition) return;

    this.hoverPosition = percents;
    this.virtualPopper.getBoundingClientRect = generateGetBoundingClientRect(
      x,
      y,
    );
    this.tooltipPopper.update();
    emit(this, "hovering", { position: percents });
  };

  handleSlotChange = (e: Event & { target: HTMLSlotElement }) => {
    this.hasCustomTooltip = isDeepAssigned(e.target);
  };

  getCursorPosition(e: CombinedEventType): [number, number, string] {
    const { clientX, target, touches } = e;
    const { y, x, width } = target.getBoundingClientRect();
    const xPosition = touches?.[0]?.clientX || clientX;
    const percents = Number(((100 / width) * (xPosition - x)).toFixed(3));
    return [
      Math.min(width + x, Math.max(x, xPosition)),
      y,
      String(Math.min(100, Math.max(0, percents))),
    ];
  }

  createPopper(element: HTMLElement) {
    this.virtualPopper = {
      getBoundingClientRect: generateGetBoundingClientRect(),
      contextElement: this,
    };

    return createPopper(this.virtualPopper, element, {
      placement: "top",
      modifiers: [
        {
          name: "flip",
          enabled: false,
        },
        {
          name: "preventOverflow",
          options: {
            boundary: closestElement("video-player", this),
            padding: 10,
          },
        },
        {
          name: "offset",
          options: {
            offset: [0, this.tooltipOffset],
          },
        },
      ],
    });
  }

  render() {
    return html`
      <div class="container">
        <input
          part="slider"
          class="slider"
          type="range"
          min="0"
          max="100"
          step="0.001"
          role="slider"
          ?disabled=${this.disabled}
          .value=${this.positionInPercents}
          .aria-valuenow=${this.currentValue}
          aria-valuemin="0"
          aria-valuemax="1"
          autocomplete="off"
          aria-valuetext=${this.valueText}
          .style="--value: ${this.positionInPercents}%"
          @input=${this.handleInput}
          @change=${this.handleChange}
        />
        ${when(
          this.withTooltip && !this.disabled,
          () => html`
            <div class="tooltip" part="tooltip">
              <slot name="tooltip" @slotchange=${this.handleSlotChange}></slot>
              ${when(
                !this.hasCustomTooltip,
                () => html` <div class="inner">${this.tooltipText}</div> `,
              )}
            </div>
          `,
        )}
        <slot></slot>
      </div>
    `;
  }

  get positionInPercents() {
    const value = (100 / this.max) * this.currentValue;
    return isNaN(value) ? "0" : value.toFixed(3);
  }
}
