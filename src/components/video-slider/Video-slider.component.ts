import { unsafeCSS, LitElement, html, PropertyValueMap } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import styles from './Video-slider.styles.css?inline'
import { emit } from '../../helpers/event'
import { watch } from '../../decorators/watch'
import { createPopper, Instance as PopperInstance, Placement } from '@popperjs/core'
import { closestElement } from '../../helpers/closest'
import { when } from 'lit/directives/when.js'

@customElement('video-slider')
export class VideoSlider extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: Number })
  value = 0

  @property({ type: Number })
  max = 1

  @property({ attribute: 'value-text' })
  valueText = ''

  @property({ attribute: 'tooltip-text' })
  tooltipText = ''

  @state()
  currentValue = 0

  @query('.tooltip')
  tooltip: HTMLElement

  @query('.slider')
  slider: HTMLInputElement

  isChanging = false
  isPendingUpdate = false

  tooltipPopper: PopperInstance

  @watch('value')
  handleValueChange() {
    if (this.isChanging) return
    if (this.isPendingUpdate) {
      setTimeout(() => {
        this.isPendingUpdate = false
      }, 200)
      return
    }
  
    this.currentValue = this.value
  }

  // protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
  //   this.tooltipPopper?.destroy()
  //   this.tooltipPopper = this.createPopper(this.tooltip)
  // }

  disconnectedCallback(): void {
    this.tooltipPopper?.destroy()
    super.disconnectedCallback()
  }

  handleInput(e: InputEvent & { target: HTMLInputElement }) {
    this.currentValue = this.max * (Number.parseFloat(e.target.value) / 100)
    this.isChanging = this.isPendingUpdate = true
  }

  handleChange() {
    emit(this, 'changed', { value: this.currentValue })
    this.isChanging = false
  }

  createPopper(element: HTMLElement) {
    return createPopper(this, element, {
      placement: 'top',
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: closestElement('video-player', this),
          },
        }, {
          name: 'offset',
          options: {
            offset: [0, 20],
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
        ${when(this.tooltipText, () => html`
          <div
            class="tooltip"
            part="tooltip"
            style="--value: ${this.positionInPercents}%"
          >
            <slot name="tooltip">
              ${this.tooltipText}
            </slot>
          </div>
        `)}
        </progress>
      </div>
    `
  }

  get positionInPercents() {
    return (100 / this.max * this.currentValue).toFixed(3)
  }
}
