import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import styles from './Video-progress.styles.css?inline'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('video-progress')
export class VideoProgress extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: Number })
  value = 0

  @property({ type: Boolean })
  loading = false

  render() {
    return html`
      <progress
        min="0"
        max="100"
        value=${ifDefined(this.loading ? undefined : Math.min(Math.max(Number(this.value), 0), 100).toFixed(3))}
        role="progressbar"
        area-hidden="true"
        ?inactive=${this.value <= 0}
      >
        <slot></slot>
      </progress>
    `
  }
}
