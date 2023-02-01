import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import styles from './Video-volume-control.styles.css?inline'
import { connect, createCommand, dispatch, Types } from '../../state'
import type { VideoSlider } from '../video-slider';

import '../video-slider';

/**
 * @slot - Video-volume-control main content
 * */
@customElement('video-volume-control')
export class VideoVolumeControl extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @connect('isMuted')
  isMuted: boolean

  @connect('volume')
  @state()
  volume: number

  handleVolumeChange(e: CustomEvent & { target: VideoSlider }) {
    this.volume = Number(e.target.position.toFixed(2))
    this.command(Types.Command.setVolume, this.volume)
  }

  handleMutedChange() {
    this.command(
      this.isMuted
        ? Types.Command.unmute
        : Types.Command.mute
    )
  }

  render() {
    console.log(this.volume)
    return html`
      <button @click=${this.handleMutedChange}>
        ${this.isMuted ? '🔇' : '🔈'}
      </button>
      <video-slider
        .value=${this.volume}
        @dragend=${this.handleVolumeChange}
      ></video-slider>
    `
  }
}
