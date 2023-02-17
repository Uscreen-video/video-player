import { LitElement, html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { connect, createCommand, Types } from '../../state'
import _backwardIcon from '../../icons/backward-solid.svg?raw'
import { Button } from '../button'

const backwardIcon = unsafeSVG(_backwardIcon)

@customElement('video-backward-button')
export class BackwardButton extends Button {
  public command = createCommand(this)

  override handleClick() {
    this.command(Types.Command.backward)
  }

  override renderContent() {
    return html`<slot>${backwardIcon}</slot>`
  }

  override renderTooltip() {
    return html`<span slot="tooltip">Backward</span>`
  }
}
