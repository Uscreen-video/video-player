import { LitElement, html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { connect, createCommand, Types } from '../../state'
import _enterIcon from '../../icons/fullscreen-enter-solid.svg?raw'
import _outIcon from '../../icons/fullscreen-out-solid.svg?raw'
import { Button } from '../button'

const enterIcon = unsafeSVG(_enterIcon)
const outIcon = unsafeSVG(_outIcon)

@customElement('video-fullscreen-button')
export class FullscreenButton extends Button {
  public command = createCommand(this)

  @connect('isFullscreen')
  isFullscreen: boolean

  override handleClick() {
    this.command(Types.Command.toggleFullscreen)
  }

  override renderContent() {
    return html`
    <slot name=${this.isFullscreen ? 'out' : 'enter'}>
      ${this.isFullscreen ? outIcon : enterIcon}
    </slot>`
  }

  override renderTooltip() {
    return html`
      <span slot="tooltip">
        ${this.isFullscreen ? 'Leave fullscreen' : 'Enter fullscreen'}
      </span>`
  }
}
