import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { createPopper, Instance as PopperInstance, Placement } from '@popperjs/core'
import styles from './Video-button.styles.css?inline'
import { closestElement } from '../../helpers/closest'
import { when } from 'lit/directives/when.js'
import { ifDefined } from 'lit/directives/if-defined.js';
import { createCommand } from '../../state'
import { eventCode } from '../../helpers/event'
import { isMobile } from '../../helpers/ismobile'

@customElement('video-button')
export class VideoButton extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @property({ type: Number, attribute: 'tooltip-offset' })
  tooltipOffset = 40

  @property({ type: Boolean, attribute: 'without-tooltip' })
  withoutTooltip = false

  @property({ attribute: 'tooltip-position' })
  tooltipPosition: Placement = 'top'

  @query('.tooltip')
  tooltip: HTMLElement

  @query('.menu')
  menu: HTMLElement

  tooltipPopper: PopperInstance
  menuPopper: PopperInstance

  createPopper(element: HTMLElement) {
    return createPopper(this, element, {
      placement: this.tooltipPosition,
      modifiers: [
        {
          name: 'flip',
          enabled: false
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: closestElement('video-player', this),
            padding: 10,
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
  
  createTooltip() {
    if (!this.withoutTooltip && this.tooltip) {
      this.tooltipPopper = this.createPopper(this.tooltip)
    }
  }

  createMenu() {
    if (this.menu) {
      this.menuPopper = this.createPopper(this.menu)
    }
  }

  destroyTooltip(): void {
    this.tooltipPopper?.destroy()
    this.tooltipPopper = undefined
  }

  destroyMenu(): void {
    this.menuPopper?.destroy()
    this.menuPopper = undefined
    this.destroyTooltip()
  }

  protected firstUpdated(): void {
    this.addEventListener('focus', this.handleFocus)
    this.addEventListener('blur', this.handleBlur)
    this.addEventListener('mouseenter', this.createTooltip)
    this.addEventListener('mouseleave', this.destroyTooltip)
  }

  disconnectedCallback(): void {
    this.destroyTooltip()
    this.destroyMenu()
    this.removeEventListener('focus', this.handleFocus)
    this.removeEventListener('blur', this.handleBlur)
    this.removeEventListener('mouseenter', this.createTooltip)
    this.removeEventListener('mouseleave', this.destroyTooltip)
  }

  handleClick(): void { }

  handleFocus = () => {
    if (!this.menu) return
    // We have to have a small timeout to not mix this event with the click event
    setTimeout(() => {
      if (!this.menuPopper) {
        this.createMenu()
      }
    }, 100)
  }

  handleBlur = () => {
    this.destroyMenu()
  }

  handleKeypress = (e: KeyboardEvent) => {
    if (eventCode(e, 'space', 'enter')) {
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

  renderMenu(): any {}

  render() {
    const content = this.renderContent()
    const tooltip = this.renderTooltip()
    const menu = this.renderMenu()

    if (!content) return null

    return html`
      <button
        tabindex="0"
        part="button"
        aria-haspopup=${ifDefined(menu && 'menu')}
        aria-controls=${ifDefined(menu && 'menu')}
        aria-describedby="tooltip"
        @click=${this.handleClick}
        @keydown=${this.handleKeypress}
      >
        ${content}
      </button>
      ${when(!isMobile(), () => html`
        <div id="tooltip" role="tooltip" class="tooltip" part="tooltip">
          <div class="inner">
            ${tooltip}
          </div>
        </div>
      `)}
      ${when(menu, () => html`
        <div id="menu" role="menu" class="menu" part="menu">
          <div class="inner">
            ${menu}
          </div>
        </div>
      `)}
    `
  }
}
