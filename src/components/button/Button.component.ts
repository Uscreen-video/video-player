import { unsafeCSS, LitElement, html, PropertyValueMap } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, eventOptions, property, query } from 'lit/decorators.js'
import { createPopper, Instance as PopperInstance, Placement } from '@popperjs/core'
import styles from './Button.styles.css?inline'
import { closestElement } from '../../helpers/closest'

@customElement('video-button')
export class Button extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: Number, attribute: 'tooltip-offset'})
  tooltipOffset = 40

  @property({ attribute: 'tooltip-potion'})
  tooltipPosition: Placement = 'top'

  @query('.tooltip')
  tooltip: HTMLElement

  public popper: PopperInstance

  initPopper(): void {
    this.popper = createPopper(this, this.tooltip, {
      placement: this.tooltipPosition,
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: closestElement('video-player', this),
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

  destroyPopper(): void {
    this.popper?.destroy()
  }

  protected firstUpdated(): void {
    this.addEventListener('mouseenter', this.initPopper)
    this.addEventListener('mouseleave', this.destroyPopper)
  }

  disconnectedCallback(): void {
    this.destroyPopper()
    this.removeEventListener('mouseenter', this.initPopper)
    this.removeEventListener('mouseleave', this.destroyPopper)
  }


  handleClick(): void { }

  handleKeypress = (e: KeyboardEvent) =>{
    if (e.code === 'Space' || e.code === 'Enter') {
      e.stopPropagation()
      Promise.resolve(() => this.handleClick())
    }
  }

  renderContent(): any {
    return html`
      <slot></slot>
    `
  }

  renderTooltip(): any {
    return html`
      <slot name="tooltip"></slot>
    `
  }

  render() {
    return html`
      <button
        tabindex="0"
        aria-describedby="tooltip"
        @click=${this.handleClick}
        @keydown=${this.handleKeypress}
      >
        ${this.renderContent()}
      </button>
      <div id="tooltip" role="tooltip" class="tooltip">
        <div class="inner">
          ${this.renderTooltip()}
        </div>
      </div>
    `
  }
}
