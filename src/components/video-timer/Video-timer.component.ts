import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './Video-timer.styles.css?inline'
import { connect } from '../../state'

const pad = (num: number, size: number) => (`000${num}`).slice(size * -1)

@customElement('video-timer')
export class VideoTimer extends LitElement {
  static styles = unsafeCSS(styles)

  @property()
  format: 'left' | 'past' | 'total' = 'left' 

  @connect('duration')
  duration: number

  @connect('currentTime')
  currentTime: number

  getTimeString(timeInSeconds: number) {
    const time = Math.abs(Number((isNaN(timeInSeconds) ? 0 : timeInSeconds).toFixed(3)))
    const hours = Math.floor(time / 60 / 60)
    const minutes = Math.floor(time / 60) % 60
    const seconds = Math.floor(time - minutes * 60)

    return hours > 0
      ? `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}`
      : `${pad(minutes, 2)}:${pad(seconds, 2)}`
  }

  get time() {
    if (this.format === 'left') return this.duration - this.currentTime
    if (this.format === 'past') return this.currentTime
    return this.duration
  }

  render() {
    return html`
      ${this.getTimeString(this.time)}
    `
  }
}
