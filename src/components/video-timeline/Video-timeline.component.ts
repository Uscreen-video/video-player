import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './Video-timeline.styles.css?inline'
import { connect, createCommand } from '../../state'
import { Command } from '../../types'
import { when } from 'lit/directives/when.js';
import { DependentPropsMixin } from '../../mixins/DependentProps'
import { timeAsString } from '../../helpers/time'

import '../video-timer'
import '../video-slider'

/**
 * @slot - Video-timeline main content
 * */
@customElement('video-timeline')
export class VideoTimeline extends DependentPropsMixin(LitElement) {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @property({ type: Boolean, reflect: true })
  timer: false

  @property({ type: Boolean, attribute: 'full-width', reflect: true })
  fullWidth = false

  @connect('duration')
  duration: number
  
  @connect('isFullscreen')
  @property({ type: Boolean, reflect: true })
  fullscreen: boolean

  @connect('currentTime')
  @state()
  currentTime: number

  handleChanged(e: { detail: { value: number } }) {
    const time = e.detail.value
    this.currentTime = time
    this.command(Command.seek, { time })
  }

  render() {
    return html`
      <video-slider
        .fullWidth=${this.fullWidth}
        .value=${this.currentTime}
        .max=${this.duration}
        .valueText="${timeAsString(this.currentTime)} of ${timeAsString(this.duration)}"
        .tooltipText="${timeAsString(this.currentTime)}"
        @changed=${this.handleChanged}
      ></video-slider>
      ${when(this.timer, () => html`
        <video-timer></video-timer>
      `)}
    `
  }
}
