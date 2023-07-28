import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { connect, Types } from '../../state'
import { VideoButton } from '../video-button'

import _pipIcon from '../../icons/play-in-window-outline.svg?raw'
import _pipActiveIcon from '../../icons/play-in-window-solid.svg?raw'

const pipIcon = unsafeSVG(_pipIcon)
const pipActiveIcon = unsafeSVG(_pipActiveIcon)

@customElement('video-pip-button')
export class PipButton extends VideoButton {
  @connect('pipAvailable')
  pipAvailable: boolean

  @connect('pipActivated')
  pipActivated: boolean

  override handleClick() {
    this.command(Types.Command.togglePip)
  }

  override renderContent() {
    if (!this.pipAvailable) return null
    return this.pipActivated
      ? html`<slot>${pipActiveIcon}</slot>`
      : html`<slot>${pipIcon}</slot>`
  }

  override renderTooltip() {
    return html`
      <slot name="tooltip:${this.pipActivated ? 'enabled' : 'disabled'}">
        ${this.pipActivated ? 'Disable picture in picture' : 'Enable picture in picture'}
      </slot>
    `
  }
}
