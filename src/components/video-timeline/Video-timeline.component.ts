import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './Video-timeline.styles.css?inline'
import { connect, createCommand } from '../../state'
import { Command } from '../../types'
import { DependentPropsMixin } from '../../mixins/DependentProps'
import { timeAsString } from '../../helpers/time'
import { VideoSlider } from '../video-slider'
import { when } from 'lit/directives/when.js'

import '../video-progress'
import '../video-slider'

/**
 * @slot - Video-timeline main content
 * */
@customElement('video-timeline')
export class VideoTimeline extends DependentPropsMixin(LitElement) {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @property({ type: Boolean })
  disabled = false

  @connect('live')
  live: boolean

  @connect('duration')
  duration: number

  @connect('buffered')
  buffered: number

  @connect('canPlay')
  canPlay: boolean
  
  @connect('isFullscreen')
  @property({ type: Boolean, reflect: true })
  fullscreen: boolean

  @property({ type: Boolean, attribute: 'full-width', reflect: true })
  fullWidth = false

  @connect('currentTime')
  @state()
  currentTime: number

  @state()
  isHovering = false

  @state()
  hoverText = ''

  handleChanged(e: { detail: { value: number } }) {
    const time = e.detail.value
    this.currentTime = time
    this.command(Command.seek, { time })
  }

  handleHover = (e: CustomEvent & { target: VideoSlider, detail: { position: number } }) => {
    this.isHovering = true
    const text = timeAsString(this.duration * (e.detail.position / 100))
    if (text === this.hoverText) return
    this.hoverText = text
  }

  handleHoverEnd = () => {
    this.isHovering = false
  }

  render() {
    const disabled = this.disabled || !this.canPlay
    return html`
      <video-slider
        with-tooltip
        .value=${this.currentTime}
        .max=${this.duration}
        .valueText="${timeAsString(this.currentTime)} of ${timeAsString(this.duration)}"
        .tooltipText="${this.isHovering ? this.hoverText : timeAsString(this.currentTime)}"
        ?disabled=${disabled}
        ?full=${this.live}
        ?loading=${!this.canPlay}
        @changed=${this.handleChanged}
        @hovering=${this.handleHover}
        @hoverend=${this.handleHoverEnd}
      >
        ${when(!this.disabled, () => html`
          <video-progress value=${100 / this.duration * this.buffered}></video-progress>
        `)}
      </video-slider>
      <slot></slot>
    `
  }
}
