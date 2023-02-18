import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import styles from './Video-volume-control.styles.css?inline'
import { connect, createCommand, dispatch, Types } from '../../state'
import type { VideoSlider } from '../video-slider';

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

  handleVolumeChange(e: CustomEvent & { target: VideoSlider }) {
    this.volume = Number(e.target.position.toFixed(2))
    this.command(Types.Command.setVolume, { volume: this.volume })
  }

  render() {
    return html`
      <video-slider
        .value=${this.isMuted ? 0 : this.volume}
        @dragend=${this.handleVolumeChange}
      ></video-slider>
    `
  }
}
