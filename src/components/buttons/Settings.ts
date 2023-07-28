import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement, property, state } from 'lit/decorators.js'
import { connect, Types } from '../../state'
import { VideoButton } from '../video-button'
import _settingsIcon from '../../icons/settings-solid.svg?raw'
import _checkmarkIcon from '../../icons/checkmark.svg?raw'
import _chevronIcon from '../../icons/chevron-left.svg?raw'
import '../video-menu'
import type { VideoMenu } from '../video-menu'
import { emit } from '../../helpers/event';

const icons = {
  settings: unsafeSVG(_settingsIcon),
  check: unsafeSVG(_checkmarkIcon),
  chevron: unsafeSVG(_chevronIcon),
}

type Menu = 'shortcuts' | 'rate' | 'quality'

@customElement('video-settings-button')
export class SubtitlesButton extends VideoButton {
  @property({ type: Array, converter: (v) => v.split(',').map(v => v.trim()) })
  settings: Menu[] = ['shortcuts', 'rate', 'quality']

  @property({ type: Object })
  translation: Record<string, any> = {}

  @connect('playbackRate')
  playbackRate: number

  @connect('activeQualityLevel')
  qualityLevel: number

  @connect('qualityLevels')
  qualityLevels: Types.State['qualityLevels']

  @state()
  activeMenu: Menu

  connectedCallback() {
    super.connectedCallback();
    if (this.isSingleMenuItem) {
      this.activeMenu = this.settings[0]
    }
  }

  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

  shortcuts = [{
    label: 'Play/Pause',
    value: 'toggle-play',
    iconAfter: html`<code>Space</code>`
  }, {
    label: 'Enter fullscreen',
    value: 'enter-fullscreen',
    iconAfter: html`<code>Enter</code>`,
  },
  {
    label: 'Exit fullscreen',
    value: 'exit-fullscreen',
    iconAfter: html`<code>Esc</code>`,
  },
  {
    label: 'Rewind',
    value: 'rewind',
    iconAfter: html`<code>←</code><code>→</code>`,
  },
  {
    label: 'Change volume',
    value: 'volume',
    iconAfter: html`<code>↓</code><code>↑</code>`,
  },
  {
    label: 'Mute',
    value: 'mute',
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
      <slot name="menu">
        <video-menu
          title=${this.selectedMenuLabel}
          @menu-item-click=${this.handleItemClick}
          .items=${this.translateLabels(this.renderMenuItems())}
        >
        </video-menu>
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
    if (value === 'back') return this.selectMenu()
    switch (this.activeMenu) {
      case 'rate': return this.selectRate(value)
      case 'quality': return this.setQuality(value)
      default: return this.selectMenu(value)
    }
  }

  translateLabels(items: any[]) {
    return items.map((i:any) => {
      if (!this.translation[i.label]) return i
      i.label = this.translation[i.label]
      return i
    })
  }

  renderMenuItems = (): any => {
    switch (this.activeMenu) {
      case 'rate': return this.rateMenuItems
      case 'shortcuts': return this.shortcutsMenuItems
      case 'quality': return this.qualityMenuItems
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
    this.activeMenu = this.isSingleMenuItem ? this.settings[0] : menu

    // We need to trigger resize event to update the menu position
    Promise.resolve().then(() => emit(this, 'resize'))
  }

  get isSingleMenuItem() {
    return this.settings.length === 1
  }

  get rateMenuItems(): any {
    const items = this.playbackRates.map(rate => ({
      label: `${rate}x`,
      value: rate,
      iconAfter: this.playbackRate === rate ? icons.check : undefined,
      isActive: this.playbackRate === rate,
    }))
    if (this.isSingleMenuItem) return items
    return [
      {
        label: 'back',
        iconBefore: icons.chevron,
        value: 'back'
      },
      ...items
    ]
  }

  get mainMenuItems() {
    const menu: VideoMenu['items'] = []
    if (this.settings.includes('shortcuts')) menu.push({
      label: 'Shortcuts',
      value: 'shortcuts',
    })
    if (this.settings.includes('rate')) menu.push({
      label: 'Playback Rate',
      value: 'rate',
      iconAfter: `${this.playbackRate}x`
    })

    if (this.settings.includes('quality') && this.qualityLevels?.length) menu.push({
      label: 'Quality',
      value: 'quality',
      iconAfter: this.qualityLevel
    })
    return menu
  }

  get selectedMenuLabel() {
    if (!this.activeMenu || !this.isSingleMenuItem) return ''
    return this.mainMenuItems.find(m => m.value === this.activeMenu).label
  }

  get shortcutsMenuItems(): any {
    if (this.isSingleMenuItem) return this.shortcuts
    return [
      {
        label: 'back',
        iconBefore: icons.chevron,
        value: 'back'
      },
      ...this.shortcuts
    ]
  }

  get qualityMenuItems(): any {
    const items = [
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
    if (this.isSingleMenuItem) return items
    return [
      {
        label: 'back',
        iconBefore: icons.chevron,
        value: 'back'
      },
      ...items
    ]
  }
}
