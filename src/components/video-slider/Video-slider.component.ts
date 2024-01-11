import { unsafeCSS, LitElement, html, PropertyValueMap } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import styles from './Video-slider.styles.css?inline'
import { emit } from '../../helpers/event'
import { watch } from '../../decorators/watch'
import { createPopper, Instance as PopperInstance, VirtualElement } from '@popperjs/core'
import { closestElement } from '../../helpers/closest'
import { when } from 'lit/directives/when.js'
import { isDeepAssigned } from '../../helpers/slot'

const generateGetBoundingClientRect = (x = 0, y = 0) => () => new DOMRect(x, y, 0, 0)

@customElement('video-slider')
export class VideoSlider extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: Number })
  value = 0

  @property({ type: Number })
  max = 1

  @property({ type: Boolean, reflect: true })
  disabled = false

  @property({ type: Boolean, reflect: true })
  full = false

  @property({ type: Boolean, reflect: true })
  loading = false

  @property({ attribute: 'value-text' })
  valueText = ''

  @property({ attribute: 'tooltip-text' })
  tooltipText = ''

  @property({ type: Boolean, attribute: 'with-tooltip' })
  withTooltip = false

  @property({ type: Number, attribute: 'tooltip-offset' })
  tooltipOffset = -11

  @state()
  currentValue?: number

  @state()
  isHovered = false

  @state()
  hasCustomTooltip = false

  hoverPosition = '0'

  @query('.tooltip')
  tooltip: HTMLElement

  @query('.slider')
  slider: HTMLInputElement

  isChanging = false
  isPendingUpdate = false

  tooltipPopper: PopperInstance
  overTimeout: number

  virtualPopper: VirtualElement

  @watch('value')
  handleValueChange() {
    this.currentValue = this.value
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (!this.withTooltip) return
    this.tooltipPopper?.destroy()
    this.addEventListener('mouseover', this.handleMouseOver)
    this.addEventListener('mouseleave', this.handleMouseLeave)
    this.addEventListener('mousemove', this.handleMouseMove)
  }

  disconnectedCallback(): void {
    this.tooltipPopper?.destroy()
    this.removeEventListener('mouseover', this.handleMouseOver)
    this.removeEventListener('mouseleave', this.handleMouseLeave)
    this.removeEventListener('mousemove', this.handleMouseMove)
    super.disconnectedCallback()
  }

  handleInput(e: InputEvent & { target: HTMLInputElement }) {
    this.currentValue = this.max * (Number.parseFloat(e.target.value) / 100)
  }

  handleChange() {
    emit(this, 'changed', { value: this.currentValue })
  }

  handleMouseOver() {
    if (!this.withTooltip || this.disabled) return

    this.isHovered = true
    this.tooltipPopper = this.createPopper(this.tooltip)
    if (this.overTimeout) {
      window.clearTimeout(this.overTimeout)
    }

    this.overTimeout = setTimeout(() => {
      if (!this.isHovered || !this.matches(':hover')) return
      this.tooltipPopper?.destroy()
      emit(this, 'hoverend')
      this.isHovered = false
    }, 5000)
  }

  handleMouseLeave() {
    if (!this.withTooltip) return
    this.tooltipPopper?.destroy()
    emit(this, 'hoverend')
    this.isHovered = false
  }

  handleMouseMove = (e: MouseEvent & { target: HTMLInputElement }) => {
    window.clearTimeout(this.overTimeout)
    if (!this.withTooltip || !this.isHovered) return
    const { clientX, target } = e
    const { y, x, width } = target.getBoundingClientRect()
    const computedPosition = (100 / width * (clientX - x)).toFixed(3)
    if (computedPosition === this.hoverPosition) return

    this.hoverPosition = computedPosition
    this.virtualPopper.getBoundingClientRect = generateGetBoundingClientRect(clientX, y)
    this.tooltipPopper.update()
    emit(this, 'hovering', { position: computedPosition })
  }

  handleSlotChange = (e: Event & { target: HTMLSlotElement }) => {
    this.hasCustomTooltip = isDeepAssigned(e.target)
  }

  createPopper(element: HTMLElement) {
    this.virtualPopper = {
      getBoundingClientRect: generateGetBoundingClientRect(),
      contextElement: this
    }
  
    return createPopper(this.virtualPopper, element, {
      placement: 'top',
      modifiers: [
        {
          name: 'flip',
          enabled: false
        }, {
          name: 'preventOverflow',
          options: {
            boundary: closestElement('video-player', this),
            padding: 10
          },
        }, {
          name: 'offset',
          options: {
            offset: [0, this.tooltipOffset],
          }
        }
      ],
    })
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
        ${when(this.withTooltip && !this.disabled, () => html`
          <div class="tooltip" part="tooltip">
            <slot name="tooltip" @slotchange=${this.handleSlotChange}></slot>
            ${when(!this.hasCustomTooltip, () => html`
              <div class="inner">${this.tooltipText}</div>
            `)}
          </div>
        `)}
        <slot></slot>
      </div>
    `
  }

  get positionInPercents() {
    const value = (100 / this.max * this.currentValue)
    return isNaN(value) ? '0' : value.toFixed(3)
  }
}
