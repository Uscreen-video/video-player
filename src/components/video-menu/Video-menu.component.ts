import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import styles from './Video-menu.styles.css?inline'
import { eventCode, emit } from '../../helpers/event'

type MenuItem = {
  value: string | number
  label: string
  isActive?: boolean
  iconBefore?: any
  iconAfter?: any
}

@customElement('video-menu')
export class VideoMenu extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: Object })
  items: MenuItem[] = []

  @property()
  title: string

  handleClick(e: any) {
    e.stopPropagation()
    emit(this, 'menu-item-click', { value: e.currentTarget.dataset.value })
  }

  handleKeyDown(e: KeyboardEvent) {
    if (eventCode(e, 'space', 'enter')) {
      e.stopPropagation()
      Promise.resolve(() => this.handleClick(e))
    }
  }

  render() {
    return html`
      ${when(this.title, () => html`<p class="title">${this.title}</p>`)}
      <ul class="menu">
        ${this.items.map(item => html`
        <li>
          <button
            tabindex="0"
            class="item"
            area-pressed=${item.isActive}
            data-value=${item.value}
            @click=${this.handleClick}
            @keydown=${this.handleKeyDown}
          >
            ${item.iconBefore}
            <span class="text">
              ${item.label}
            </span>
            ${item.iconAfter}
          </button>
        </li>
        `)}
      </ul>
    `
  }
}
