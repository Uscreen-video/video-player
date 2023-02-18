import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { Types } from '../../state'
import { Button } from '../button'

import _forwardIcon from '../../icons/forward-solid.svg?raw'

const forwardIcon = unsafeSVG(_forwardIcon)

@customElement('video-forward-button')
export class ForwardButton extends Button {
  override handleClick() {
    this.command(Types.Command.forward)
  }

  override renderContent() {
    return html`<slot>${forwardIcon}</slot>`
  }

  override renderTooltip() {
    return html`<span slot="tooltip">Forward</span>`
  }
}
