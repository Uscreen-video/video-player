import { unsafeCSS, LitElement, html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './Video-errors-manager.styles.css?inline'
import { Types, connect, dispatch, listen } from '../../state'

@customElement('video-errors-manager')
export class VideoErrorsManager extends LitElement {
  static styles = unsafeCSS(styles)

  timer = 0

  @property({ type: Number })
  timeout = 5000

  @connect('src')
  src: string

  @state()
  message = ''

  @listen(Types.Command.error)
  handleErrors(error: MediaError) {
    if (error.message) this.print(error.message)
    if (error.code === MediaError.MEDIA_ERR_NETWORK) {
      dispatch(this, Types.Action.update, { canPlay: false })
      this.requestSrc(5)
        .then(() => dispatch(this, Types.Action.update, { canPlay: true, src: this.src + '#' + Math.random().toString(36).slice(2, 7) }))
        .catch(() => this.print('Maximum connection attempts. Please reload this page', true))
    }
  }
  
  clear = () => {
    if (this.timeout) clearTimeout(this.timer)
    this.message = ''
  }
  
  print = (message: string, persist = false) => {
    this.message = message
    if (!persist) this.timer = setTimeout(this.clear, this.timeout)
  }
  
  requestSrc = async (attempts: number) => {
    if (!attempts) throw new Error('Video is not available')
  
    this.print('This stream is currently inactive. Connecting...')
    await new Promise((resolve) => setTimeout(resolve, this.timeout))
    const { ok } = await fetch(this.src)
    if (!ok) await this.requestSrc(attempts - 1)
  }

  render() {
    if (!this.message) return null
    return html`
      <div>
        ${this.message}
      </div>
    `
  }
}
