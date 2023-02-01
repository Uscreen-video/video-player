import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import styles from './Video-timeline.styles.css?inline'
import { connect, createCommand, dispatch } from '../../state'
import { Action, Command } from '../../types'
import {styleMap} from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';
import '../video-timer'

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

  @state()
  pointerPosition = 0

  @state()
  isDragging = false

  @state()
  isHovered = false

  @query('.line-container')
  line: HTMLDivElement

  connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('mousemove', this.handlePointerMove)
    document.addEventListener('touchmove', this.handlePointerMove)
    document.addEventListener('mouseup', this.handlePointerRelease)
    document.addEventListener('touchend', this.handlePointerRelease)
    document.addEventListener('mouseleave', this.handlePointerLeave)
  }

  disconnectedCallback(): void {
    document.removeEventListener('mousemove', this.handlePointerMove)
    document.removeEventListener('touchmove', this.handlePointerMove)
    document.removeEventListener('mouseup', this.handlePointerRelease)
    document.removeEventListener('touchend', this.handlePointerRelease)
    document.removeEventListener('mouseleave', this.handlePointerLeave)
  }

  handleMouseUp = (e: PointerEvent & TouchEvent) => {
    e.preventDefault()
  }

  /**
   * When user releases the timeline we think the dragging is over
   */
  handlePointerRelease = () => {
    if (this.isDragging) {
      dispatch(this, Action.seekEnd)
      this.dispatchTimeUpdate()
    }
    this.isDragging = false
  }

  /**
   * We track pointer movement by the X coord 
   * if user hover the line or start started its dragging
   */
  handlePointerMove = ({ clientX, targetTouches }: PointerEvent & TouchEvent) =>{
    if (!this.isDragging && !this.isHovered) return
    const eventClientX = targetTouches?.[0]?.clientX || clientX
    const newPosition = this.getPinterPosition(eventClientX)

    if (newPosition === null) return

    this.pointerPosition = newPosition
  }

  /**
   * If user pushed the screen or the button over the line
   * we think he started dragging
   */
  handlePointerDown() {
    this.isDragging = true
    dispatch(this, Action.seekStart)
  }

  /**
   * When mouse is over the line we think its hovered
   */
  handlePointerEnter() {
    this.isHovered = true
  }

  /**
   * When mouse leaves the line we think its not hovered any more
   */
  handlePointerLeave() {
    this.isHovered = false
  }

  /**
   * Handle click the line and stop dragging
   */
  handleLineClick() {
    this.isDragging = false
  }

  dispatchTimeUpdate(progress?: number) {
    const time = this.duration * (progress || this.progressPosition)
    dispatch(this, Action.seekEnd)
    this.currentTime = time
    this.command(Command.seek, { time })
  }

  getPinterPosition(clientX: number) {
    const { x, width } = this.line.getBoundingClientRect()
    const leftBorder = x
    const rightBorder = x + width
    const newPosition = clientX - x

    if (
      clientX < leftBorder ||
      clientX > rightBorder ||
      newPosition < 0
    ) return 0

    return newPosition / width
  }

  render() {
    return html`
      <div 
        class="container"
        @mouseenter=${this.handlePointerEnter}
        @mouseleave=${this.handlePointerLeave}
        @mouseup=${this.handleMouseUp}
        @mousedown=${this.handlePointerDown}
        @touchstart=${this.handlePointerDown}
        @click=${this.handleLineClick}
      >
        <div class="line-container">

          <div class="line">
            <div 
              class="progress"
              style=${styleMap({
                transform: `scaleX(${this.progressPosition})`
              })}
            ></div>
          </div>
  
          <button
            class="handler"
            style=${styleMap({
              transform: `translateX(${this.progressPosition * 100 + '%'})`
            })}
          ></button>

        </div>
      </div>
      ${when(this.timer, () => html`
        <video-timer></video-timer>
      `)}
    `
  }

  get progressPosition() {
    if (this.isDragging) {
      return this.pointerPosition
    } else {
      const { duration, currentTime } = this
      if (!currentTime || !duration) return 0
      if (currentTime >= duration) return 1
      return currentTime / duration
    }
  }
}
