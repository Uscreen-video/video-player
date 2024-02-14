import { unsafeCSS, LitElement, html, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './Video-errors-manager.styles.css?inline'
import { Types, connect, dispatch, listen } from '../../state'

@customElement('video-errors-manager')
export class VideoErrorsManager extends LitElement {
  static styles = unsafeCSS(styles)

  timer = 0

  @property({ type: Number })
  timeout = 10000

  @connect('src')
  src: string

  @state()
  message: string | TemplateResult<any> = ''

  @listen(Types.Command.error)
  handleErrors(error: MediaError) {
    if (error.message) this.print(error.message)
    if (error.code === MediaError.MEDIA_ERR_NETWORK) {
      dispatch(this, Types.Action.update, { canPlay: false })
      this.requestSrc(5)
        .then(() => dispatch(this, Types.Action.update, { canPlay: true, src: this.src + '#' + Math.random().toString(36).slice(2, 7) }))
        .catch(() => this.print(html`The stream could not be fetched after the maximum allowed connection attempts.<br> Please reload this page to try again.`, true))
    }
  }
  
  clear = () => {
    if (this.timer) clearTimeout(this.timer)
    this.timer = 0
    this.message = ''
  }
  
  print = (message: string | TemplateResult<any>, persist = false) => {
    this.message = message
    if (!persist) this.timer = setTimeout(this.clear, this.timeout)
  }
  
  requestSrc = async (attempts: number) => {
    if (!attempts) throw new Error('Video is not available')
  
    this.print(html`The stream is currently not active.<br> Attempting to establish a connection...`)
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
