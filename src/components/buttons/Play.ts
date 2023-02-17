import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { connect, createCommand, Types } from '../../state'
import { Button } from '../button'

import _playIcon from '../../icons/play-solid.svg?raw'
import _pauseIcon from '../../icons/pause-solid.svg?raw'

const playIcon = unsafeSVG(_playIcon)
const pauseIcon = unsafeSVG(_pauseIcon)

@customElement('video-play-button')
export class PlayButton extends Button {
  public command = createCommand(this)
  
  @connect('isPlaying')
  isPlaying: boolean

  override handleClick() {
    this.command(
      this.isPlaying
        ? Types.Command.pause
        : Types.Command.play
    )
  }

  override renderContent() {
    return html`
      <slot name=${this.isPlaying ? 'play' : 'pause'}>
        ${this.isPlaying ? pauseIcon : playIcon}
      </slot>
    `
  }

  override renderTooltip() {
    return html`
      <span slot="tooltip">
        ${this.isPlaying ? 'Pause' : 'Play'}
      </span>
    `
  }
}
