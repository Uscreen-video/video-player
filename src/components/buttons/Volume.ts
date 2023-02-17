import { html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement } from 'lit/decorators.js'
import { connect, createCommand, Types } from '../../state'
import { Button } from '../button'

import _midIcon from '../../icons/volume-mid-solid.svg?raw'
import _minIcon from '../../icons/volume-min-solid.svg?raw'
import _muteIcon from '../../icons/volume-mute-solid.svg?raw'
import _maxIcon from '../../icons/volume-max-solid.svg?raw'

const icons = {
  mid: unsafeSVG(_midIcon),
  min: unsafeSVG(_minIcon),
  muted: unsafeSVG(_muteIcon),
  max: unsafeSVG(_maxIcon),
}

@customElement('video-volume-button')
export class VolumeButton extends Button {
  public command = createCommand(this)
  
  @connect('volume')
  volume: number

  @connect('isMuted')
  isMuted: boolean

  override handleClick() {
    this.command(Types.Command.toggleMuted)
  }

  override renderContent() {
    const level = this.getVolumeLevel()
    return html`
      <slot name=${level}>
        ${icons[level]}
      </slot>
    `
  }

  override renderTooltip() {
    return html`
      <span slot="tooltip">
        ${this.isMuted ? 'Unmute' : 'Mute'}
      </span>
    `
  }

  getVolumeLevel() {
    const { volume, isMuted } = this

    if (isMuted) return 'muted'
    if (volume > 0.7) return 'max'
    if (volume > 0.3) return 'mid'
    return 'min'
  }
}
