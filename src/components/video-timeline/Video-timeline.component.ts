import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './Video-timeline.styles.css?inline'
import { connect, createCommand, dispatch } from '../../state'
import { Action, Command } from '../../types'
import { when } from 'lit/directives/when.js';
import type { VideoSlider } from '../video-slider';

import '../video-timer'
import '../video-slider'

/**
 * @slot - Video-timeline main content
 * */
@customElement('video-timeline')
export class VideoTimeline extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @property({ type: Boolean })
  timer: false

  @connect('duration')
  duration: number

  @connect('currentTime')
  @state()
  currentTime: number

  handleChanged(progress: number) {
    const time = this.duration * progress
    this.currentTime = time
    this.command(Command.seek, { time })
  }

  handleDragEnd(e: CustomEvent & { target: VideoSlider }) {
    dispatch(this, Action.seekEnd)
    this.handleChanged(e.target.position)
  }

  handleDragStart() {
    dispatch(this, Action.seekStart)
  }


  render() {
    return html`
      <video-slider
        .value=${this.currentTime / this.duration}
        @dragstart=${this.handleDragStart}
        @dragend=${this.handleDragEnd}
        @changed=${this.handleChanged}
      ></video-slider>
      ${when(this.timer, () => html`
        <video-timer></video-timer>
      `)}
    `
  }
}
