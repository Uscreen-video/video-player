import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js';
import { connect, Types } from '../../state'
import { Button } from '../button'
import { State } from '../../types';
import _settingsIcon from '../../icons/settings-solid.svg?raw'
import _checkmarkIcon from '../../icons/checkmark.svg?raw'

const icons = {
  settings: unsafeSVG(_settingsIcon),
  check: unsafeSVG(_checkmarkIcon),
}

enum Menu {
  shortcuts,
  rate,
  quality
}

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

@customElement('video-settings-button')
export class SubtitlesButton extends Button {
  @property({ type: Object })

  @connect('playbackRate')
  playbackRate: number 

  @state()
  activeMenu: Menu

  override handleClick = () => {
    if (this.menuPopper) return this.destroyMenu()
    this.destroyTooltip()
    this.createMenu()
    document.addEventListener('click', this.removeMenu)
  }

  removeMenu = (e?: PointerEvent) => {
    if (!e || e.target !== this) {
      this.destroyMenu()
      this.selectMenu()
      document.removeEventListener('click', this.removeMenu)
    }
  }

  override renderContent() {
    return html`
      <slot name="icon">
        ${icons.settings}
      </slot>
    `
  }

  override renderTooltip() {
    return html`<span slot="tooltip">Settings</span>`
  }

  override renderMenu = () => {
    return html`
      <span slot="main-menu">
        <ul>
          ${this.renderMenuItems()}
        </ul>
      </span>
    `
  }

  renderMenuItems = () => {
    switch (this.activeMenu) {
      case Menu.rate: return html`
        ${this.renderMenuItem({
          label: 'back',
          iconBefore: icons.check,
          onClick: () => this.selectMenu()
        })}
        ${playbackRates.map(rate => this.renderMenuItem({
          label: `${rate}x`,
          iconAfter: this.playbackRate === rate ? icons.check : undefined,
          isActive: this.playbackRate === rate,
          onClick: () => this.setRate(rate),
        }))}
      `
      default: return html`
        ${this.renderMenuItem({
          label: 'Shortcuts',
          onClick: () => this.selectMenu(Menu.shortcuts)
        })}
        ${this.renderMenuItem({
          label: 'Playback Rate',
          onClick: () => this.selectMenu(Menu.rate)
        })}
        ${this.renderMenuItem({
          label: 'Quality',
          onClick: () => this.selectMenu(Menu.quality)
        })}
      `
    }
  }

  setRate = (playbackRate: number) => {
    this.command(Types.Command.setPlaybackRate, { playbackRate })
    this.removeMenu()
  }

  selectMenu(menu?: Menu) {
    this.activeMenu = menu
  }

  handleItemClick(lang: string) {
    this.command(Types.Command.enableTextTrack, { lang })
    this.removeMenu()
  }

  renderMenuItem = ({
    label,
    onClick,
    iconBefore,
    iconAfter,
    isActive = false
  }: {
    label: string,
    onClick: () => void
    iconBefore?: any,
    iconAfter?: any,
    isActive?: boolean
  }) => html`
    <li>
      <button
        class="menu-item"
        area-pressed=${isActive}
        @click=${onClick}
      >
        ${iconBefore}
        <span>
          ${label}
        </span>
        ${iconAfter}
      </button>
    </li>
  `
}
