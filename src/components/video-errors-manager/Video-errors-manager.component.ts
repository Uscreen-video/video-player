import { unsafeCSS, LitElement, html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './Video-errors-manager.styles.css?inline'
import { Types, connect, listen } from '../../state'

@customElement('video-errors-manager')
export class VideoErrorsManager extends LitElement {
  static styles = unsafeCSS(styles)

  @listen(Types.Command.error)
  handleErrors() {

  }

  render() {
    return html``
  }
}
