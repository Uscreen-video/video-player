import { unsafeCSS, LitElement } from 'lit'
import { unsafeStatic, html } from 'lit/static-html.js'
import { customElement, property } from 'lit/decorators.js'
import styles from './Video-cues.styles.css?inline'
import { connect } from '../../state'

@customElement('video-cues')
export class VideoCues extends LitElement {
  static styles = unsafeCSS(styles)

  @connect('idle')
  @property({ type: Boolean, reflect: true })
  idle: boolean

  @connect('activeTextTrack')
  activeTextTrack: string

  @connect('cues')
  cues: string[]

  @connect('isIos')
  @property({ type: Boolean, reflect: true, attribute: 'is-ios' })
  isIos: true

  render() {
    if (this.isIos || !this.activeTextTrack) return null
    return this.cues.map(cue => html`
      <div class="cue">
        <span>${unsafeStatic(cue)}</span>
      </div>
    `)
  }
}
