import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { Types } from '../../state'
import { VideoButton } from '../video-button'

import _backwardIcon from '../../icons/backward-solid.svg?raw'
const backwardIcon = unsafeSVG(_backwardIcon)

@customElement('video-backward-button')
export class BackwardButton extends VideoButton {
  override handleClick() {
    this.command(Types.Command.backward)
  }

  override renderContent() {
    return html`<slot name="icon">${backwardIcon}</slot>`
  }

  override renderTooltip() {
    return html`<slot name="tooltip">Backward</slot>`
  }
}
