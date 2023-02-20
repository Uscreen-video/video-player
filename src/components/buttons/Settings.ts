import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js';
import { connect, Types } from '../../state'
import { VideoButton } from '../video-button'
import { State } from '../../types';
import _settingsIcon from '../../icons/settings-solid.svg?raw'
import _checkmarkIcon from '../../icons/checkmark.svg?raw'
import '../video-menu'

const icons = {
  settings: unsafeSVG(_settingsIcon),
  check: unsafeSVG(_checkmarkIcon),
}

enum Menu { shortcuts, rate, quality }
const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

@customElement('video-settings-button')
export class SubtitlesButton extends VideoButton {
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
      <slot slot="main-menu">
        <video-menu
          @menu-item-click=${this.handleItemClick}
          .items=${this.renderMenuItems()}
        ></video-menu>
      </slot>
    `
  }

  removeMenu = (e?: PointerEvent) => {
    if (!e || e.target !== this) {
      this.destroyMenu()
      this.selectMenu()
      document.removeEventListener('click', this.removeMenu)
    }
  }

  handleItemClick = ({ detail }: CustomEvent<{ value: any }>) => {
    const value = detail.value
    console.log(value)
    if (!value) return this.selectMenu()
    switch (this.activeMenu) {
      case Menu.rate: return this.selectRate(value)
      case Menu.quality: return this.setQuality(value)
      default: return this.selectMenu(value)
    }
  }

  renderMenuItems = () => {
    switch (this.activeMenu) {
      case Menu.rate: return this.rateMenuItems
      default: return this.mainMenuItems
    }
  }
  

  selectRate = (playbackRate: number) => {
    this.command(Types.Command.setPlaybackRate, { playbackRate })
    this.removeMenu()
  }

  setQuality = (playbackRate: number) => {
    this.command(Types.Command.setPlaybackRate, { playbackRate })
    this.removeMenu()
  }

  selectMenu(menu?: Menu) {
    this.activeMenu = Number(menu)
  }

  get rateMenuItems() {
    return [
      {
        label: 'back',
        iconBefore: icons.check,
        value: ''
      },
      ...playbackRates.map(rate => ({
        label: `${rate}x`,
        value: rate,
        iconAfter: this.playbackRate === rate ? icons.check : undefined,
        isActive: this.playbackRate === rate,
      }))
    ]
  }

  get mainMenuItems() {
    return [{
      label: 'Shortcuts',
      value: Menu.shortcuts
    }, {
      label: 'Playback Rate',
      value: Menu.rate
    }, {
      label: 'Quality',
      value: Menu.quality
    }]
  }
}
