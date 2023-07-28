import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement, property } from 'lit/decorators.js'
import { connect, Types } from '../../state'
import { VideoButton } from '../video-button'
import { State } from '../../types';
import solidIcon from '../../icons/subtitles-solid.svg?raw'
import outlineIcon from '../../icons/subtitles-outline.svg?raw'
import checkIcon from '../../icons/checkmark.svg?raw'

import '../video-menu'

const icons = {
  outline: unsafeSVG(outlineIcon),
  solid: unsafeSVG(solidIcon),
  check: unsafeSVG(checkIcon),
}

@customElement('video-subtitles-button')
export class SubtitlesButton extends VideoButton {
  @connect('activeTextTrack')
  activeTrack: string

  @connect('textTracks')
  textTracks: State['textTracks']

  @property({ type: Object })
  translation: Record<string, string> = {}

  override handleClick = () => {
    if (this.menuPopper) return this.destroyMenu()
    this.destroyTooltip()
    this.createMenu()
    document.addEventListener('click', this.removeMenu)
  }

  override renderContent() {
    if (!this.textTracks?.length) return null

    return html`
      <slot name=${this.activeTrack ? 'selected' : 'not-selected'}>
        ${this.activeTrack ? icons.solid : icons.outline}
      </slot>
    `
  }

  override renderTooltip() {
    return html`<slot name="tooltip">Subtitles</slot>`
  }

  override renderMenu = () => {
    return html`
      <slot name="menu">
        <video-menu
          @menu-item-click=${this.handleItemClick}
          .items=${this.translateLabels(this.getMenuItems)}
        >
        </video-menu>
      </slot>
    `
  }

  translateLabels(items: any[]) {
    return items.map((i:any) => {
      if (!this.translation[i.label]) return i
      i.label = this.translation[i.label]
      return i
    })
  }

  removeMenu = (e?: PointerEvent) => {
    if (!e || e.target !== this) {
      this.destroyMenu()
      document.removeEventListener('click', this.removeMenu)
    }
  }

  handleItemClick = (e: any) => {
    const lang = e.detail.value
    this.command(Types.Command.enableTextTrack, { lang: lang === 'off' ? '' : lang })
    this.removeMenu()
  }

  get getMenuItems(): any {
    const active = this.activeTrack || ''
    return [
      { label: 'Off', lang: '' },
      ...this.textTracks || [],
    ].map(track => ({
      ...track,
      value: track.lang || 'off',
      isActive: active === track.lang,
      iconAfter: active === track.lang ? icons.check : null
    }))
  }
}
