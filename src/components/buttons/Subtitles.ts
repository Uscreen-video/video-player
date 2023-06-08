import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
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
    
  override handleClick = () => {
    if (this.menuPopper) return this.destroyMenu()
    this.destroyTooltip()
    this.createMenu()
    document.addEventListener('click', this.removeMenu)
  }

  override renderContent() {
    return html`
      <slot name=${this.activeTrack ? 'selected' : 'not-selected'}>
        ${this.activeTrack ? icons.solid : icons.outline}
      </slot>
    `
  }

  override renderTooltip() {
    return html`<span slot="tooltip">Subtitles</span>`
  }

  override renderMenu = () => {
    return html`
      <video-menu
        @menu-item-click=${this.handleItemClick}
        .items=${this.getMenuItems}
      >
      </video-menu>
    `
  }

  removeMenu = (e?: PointerEvent) => {
    if (!e || e.target !== this) {
      this.destroyMenu()
      document.removeEventListener('click', this.removeMenu)
    }
  }

  handleItemClick = (e: any) => {
    const lang = e.detail.value
    this.command(Types.Command.enableTextTrack, { lang })
    this.removeMenu()
  }

  get getMenuItems(): any {
    const active = this.activeTrack || ''
    return [
      { label: 'Off', lang: '' },
      ...this.textTracks || [],
    ].map(track => ({
      ...track,
      value: track.lang,
      isActive: active === track.lang,
      iconAfter: active === track.lang ? icons.check : null
    }))
  }
}
