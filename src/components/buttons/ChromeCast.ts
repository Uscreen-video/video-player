import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { connect, Types } from '../../state'
import { VideoButton } from '../video-button'

import _castIcon from '../../icons/chrome-cast-outline.svg?raw'
import { CastStatus } from '../../types';
const castIcon = unsafeSVG(_castIcon)

@customElement('video-chromecast-button')
export class ChromeCastButton extends VideoButton {
  @connect('castAvailable')
  available: boolean

  @connect('castStatus')
  status: CastStatus

  override handleClick() {
    this.command(Types.Command.requestCast)
  }

  override renderContent() {
    if (!this.available) return null
    return html`<slot>${castIcon}</slot>`
  }

  override renderTooltip() {
    return html`<span slot="tooltip">
      ${this.status === 'enabled' ? 'Disable Cast' : 'Enable Chrome Cast'}
    </span>`
  }
}
