import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { connect, Types } from '../../state'
import { VideoButton } from '../video-button'

import enterIcon from '../../icons/fullscreen-enter-solid.svg?raw'
import outIcon from '../../icons/fullscreen-out-solid.svg?raw'

const icons = {
  in: unsafeSVG(enterIcon),
  out: unsafeSVG(outIcon)
}

@customElement('video-fullscreen-button')
export class FullscreenButton extends VideoButton {
  @connect('isFullscreen')
  isFullscreen: boolean

  override handleClick() {
    this.command(Types.Command.toggleFullscreen)
  }

  override renderContent() {
    return html`
    <slot name=${this.isFullscreen ? 'out' : 'enter'}>
      ${this.isFullscreen ? icons.out : icons.in}
    </slot>`
  }

  override renderTooltip() {
    return html`
      <span slot="tooltip">
        ${this.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      </span>`
  }
}
