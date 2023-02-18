import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { createPopper, Instance as PopperInstance, Placement } from '@popperjs/core'
import styles from './Button.styles.css?inline'
import { closestElement } from '../../helpers/closest'
import { when } from 'lit/directives/when.js'
import { ifDefined } from 'lit/directives/if-defined.js';
import { createCommand } from '../../state'

@customElement('video-button')
export class Button extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @property({ type: Number, attribute: 'tooltip-offset'})
  tooltipOffset = 40

  @property({ attribute: 'tooltip-potion'})
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
  
  createTooltip() {
    this.tooltipPopper = this.createPopper(this.tooltip)
  }

  createMenu() {
    this.menuPopper = this.createPopper(this.menu)
  }

  destroyTooltip(): void {
    this.tooltipPopper?.destroy()
  }

  destroyMenu(): void {
    this.menuPopper?.destroy()
  }

  protected firstUpdated(): void {
    this.addEventListener('mouseenter', this.createTooltip)
    this.addEventListener('mouseleave', this.destroyTooltip)
  }

  disconnectedCallback(): void {
    this.destroyTooltip()
    this.destroyMenu()
    this.removeEventListener('mouseenter', this.createTooltip)
    this.removeEventListener('mouseleave', this.destroyTooltip)
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

  renderMenu(): any {}

  render() {
    const content = this.renderContent()
    const tooltip = this.renderTooltip()
    const menu = this.renderMenu()
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
      <div id="tooltip" role="tooltip" class="tooltip" part="tooltip">
        <div class="inner">
          ${tooltip}
        </div>
      </div>
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
