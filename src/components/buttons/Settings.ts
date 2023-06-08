import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement, property, state } from 'lit/decorators.js'
import { connect, Types } from '../../state'
import { VideoButton } from '../video-button'
import _settingsIcon from '../../icons/settings-solid.svg?raw'
import _checkmarkIcon from '../../icons/checkmark.svg?raw'
import _chevronIcon from '../../icons/chevron-left.svg?raw'
import '../video-menu'
import { emit } from '../../helpers/event';

const icons = {
  settings: unsafeSVG(_settingsIcon),
  check: unsafeSVG(_checkmarkIcon),
  chevron: unsafeSVG(_chevronIcon),
}

enum Menu { shortcuts, rate, quality }

@customElement('video-settings-button')
export class SubtitlesButton extends VideoButton {
  @property({ type: Object })

  @connect('playbackRate')
  playbackRate: number

  @connect('activeQualityLevel')
  qualityLevel: number

  @connect('qualityLevels')
  qualityLevels: Types.State['qualityLevels']

  @state()
  activeMenu: Menu

  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

  shortcuts = [{
    label: 'player.play_pause',
    iconAfter: html`<code>Space</code>`
  }, {
    label: 'player.fullscreen',
    iconAfter: html`<code>Enter</code>`,
  },
  {
    label: 'player.exit_fullscreen',
    iconAfter: html`<code>Esc</code>`,
  },
  {
    label: 'player.rewind',
    iconAfter: html`<code>←</code><code>→</code>`,
  },
  {
    label: 'player.change_volume',
    iconAfter: html`<code>↓</code><code>↑</code>`,
  },
  {
    label: 'player.mute',
    iconAfter: html`<code>M</code>`
  }]

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
    if (!value) return this.selectMenu()
    switch (this.activeMenu) {
      case Menu.rate: return this.selectRate(value)
      case Menu.quality: return this.setQuality(value)
      default: return this.selectMenu(value)
    }
  }

  renderMenuItems = (): any => {
    switch (this.activeMenu) {
      case Menu.rate: return this.rateMenuItems
      case Menu.shortcuts: return this.shortcutsMenuItems
      case Menu.quality: return this.qualityMenuItems
      default: return this.mainMenuItems
    }
  }

  selectRate = (playbackRate: number) => {
    this.command(Types.Command.setPlaybackRate, { playbackRate })
    this.removeMenu()
  }

  setQuality = (level: string) => {
    this.command(Types.Command.setQualityLevel, { level: Number(level) })
    this.removeMenu()
  }

  selectMenu(menu?: Menu) {
    this.activeMenu = Number(menu)

    // We need to trigger resize event to update the menu position
    Promise.resolve().then(() => emit(this, 'resize'))
  }

  get rateMenuItems(): any {
    return [
      {
        label: 'back',
        iconBefore: icons.chevron,
        value: ''
      },
      ...this.playbackRates.map(rate => ({
        label: `${rate}x`,
        value: rate,
        iconAfter: this.playbackRate === rate ? icons.check : undefined,
        isActive: this.playbackRate === rate,
      }))
    ]
  }

  get mainMenuItems() {
    const menu = [{
      label: 'Shortcuts',
      value: Menu.shortcuts
    }, {
      label: 'Playback Rate',
      value: Menu.rate
    }]
    if (this.qualityLevels?.length) menu.push({
      label: 'Quality',
      value: Menu.quality
    })
    return menu
  }

  get shortcutsMenuItems(): any {
    return [
      {
        label: 'back',
        iconBefore: icons.chevron,
        value: ''
      },
      ...this.shortcuts
    ]
  }

  get qualityMenuItems(): any {
    return [
      {
        label: 'back',
        iconBefore: icons.chevron,
        value: ''
      },
      {
        label: 'auto',
        iconAfter: this.qualityLevel === -1 ? icons.check : undefined,
        isActive: this.qualityLevel === -1,
        value: -1
      },
      ...this.qualityLevels.map(level => ({
        label: `${level.name}p`,
        value: level.name,
        iconAfter: this.qualityLevel === Number(level.name) ? icons.check : undefined,
        isActive: this.qualityLevel === Number(level.name),
      }))
    ]
  }
}
