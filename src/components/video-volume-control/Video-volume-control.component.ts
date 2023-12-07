import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import styles from './Video-volume-control.styles.css?inline'
import { connect, createCommand, Types } from '../../state'

import '../video-slider';

@customElement('video-volume-control')
export class VideoVolumeControl extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @connect('isMuted')
  isMuted: boolean

  @connect('volume')
  @state()
  volume: number

  @connect('cues')
  cues: string[]

  @connect('isIos')
  isIos: boolean

  handleVolumeChange(e: CustomEvent & { detail: number }) {
    this.volume = Number(e.detail.value.toFixed(2))
    this.command(Types.Command.setVolume, { volume: this.volume })
  }

  render() {
    if (this.isIos) return null
    return html`
      <video-slider
        .value=${this.isMuted ? 0 : this.volume}
        @changed=${this.handleVolumeChange}
      ></video-slider>
    `
  }
}
