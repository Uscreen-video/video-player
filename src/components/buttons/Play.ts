import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { connect, Types } from '../../state'
import { VideoButton } from '../video-button'

import playIcon from '../../icons/play-solid.svg?raw'
import pauseIcon from '../../icons/pause-solid.svg?raw'

const icons = {
  play: unsafeSVG(playIcon),
  pause: unsafeSVG(pauseIcon)
}

@customElement('video-play-button')
export class PlayButton extends VideoButton {  
  @connect('isPlaying')
  isPlaying: boolean

  override handleClick() {
    this.command(Types.Command.togglePlay)
  }

  override renderContent() {
    return html`
      <slot name=${this.isPlaying ? 'play' : 'pause'}>
        ${this.isPlaying ? icons.pause : icons.play}
      </slot>
    `
  }

  override renderTooltip() {
    return html`
      <slot name="tooltip">
        ${this.isPlaying ? 'Pause' : 'Play'}
      </slot>
    `
  }
}
