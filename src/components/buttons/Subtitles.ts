import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js';
import { connect, Types } from '../../state'
import { Button } from '../button'
import { State } from '../../types';
import solidIcon from '../../icons/subtitles-solid.svg?raw'
import outlineIcon from '../../icons/subtitles-outline.svg?raw'
import checkIcon from '../../icons/checkmark.svg?raw'

const icons = {
  outline: unsafeSVG(outlineIcon),
  solid: unsafeSVG(solidIcon),
  check: unsafeSVG(checkIcon),
}

@customElement('video-subtitles-button')
export class SubtitlesButton extends Button {
  @connect('activeTextTrack')
  activeTrack: string

  @connect('textTracks')
  textTracks: State['textTracks'] = []
    
  override handleClick() {
    this.destroyTooltip()
    this.createMenu()
    document.addEventListener('click', this.removeMenu)
  }

  removeMenu = (e: PointerEvent) => {
    if (e.target !== this) {
      this.destroyMenu()
      document.removeEventListener('click', this.removeMenu)
    }
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
    <span slot="menu">
      <ul>
        ${this.renderMenuItem({ label: 'Off' })}
        ${this.textTracks?.map(track => this.renderMenuItem(track))}
      </ul>
    </span>`
  }

  renderMenuItem({ lang, label }: Partial<typeof this.textTracks[0]>) {
    const isActive = this.activeTrack === lang
    return html`
      <li>
        <button
          area-pressed=${isActive}
          @click=${() =>
            this.command(Types.Command.enableTextTrack, { lang })
          }
        >
          ${label}
          ${when(isActive, () => icons.check)}
        </button>
      </li>
    `
  }
}
