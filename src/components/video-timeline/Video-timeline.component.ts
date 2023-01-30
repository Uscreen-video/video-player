import { unsafeCSS, LitElement, html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, query, state } from 'lit/decorators.js'
import styles from './Video-timeline.styles.css?inline'
import { connect, createCommand, dispatch } from '../../state'
import { Action, Command } from '../../state/types'
import {styleMap} from 'lit/directives/style-map.js';
import { watch } from '../../decorators/watch'

/**
 * @slot - Video-timeline main content
 * */
@customElement('video-timeline')
export class VideoTimeline extends LitElement {
  static styles = unsafeCSS(styles)
  public command = createCommand(this)

  @connect('duration')
  duration: number

  @connect('currentTime')
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
    document.addEventListener('mousemove', this.handlePointerMove, { passive: true })
    document.addEventListener('touchmove', this.handlePointerMove, { passive: true })
    document.addEventListener('mouseup', this.handlePointerUp)
    document.addEventListener('touchend', this.handlePointerUp)
    document.addEventListener('mouseleave', this.handlePointerLeave, { passive: true })
  }

  disconnectedCallback(): void {
    document.removeEventListener('mousemove', this.handlePointerMove)
    document.removeEventListener('touchmove', this.handlePointerMove)
    document.removeEventListener('mouseup', this.handlePointerUp)
    document.removeEventListener('touchend', this.handlePointerUp)
    document.removeEventListener('mouseleave', this.handlePointerLeave)

  }

  handleMouseUp = (e: PointerEvent & TouchEvent) => {
    e.preventDefault()
  }

  /**
   * When user releases the timeline we think the dragging is over
   */
  handlePointerUp = () => {
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
    console.log('dragging started')
    this.isDragging = true
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
   * Handle click the line and update state
   */
  handleLineClick({ offsetX }: PointerEvent) {
    if (this.isDragging) {
      this.isDragging = false
      return
    }

    const percentage = offsetX / this.line.clientWidth
    const time = Math.round(this.duration * percentage)

    dispatch(this, Action.seekEnd)
    this.command(Command.seek, { time: time })
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
    ) return null

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
              class="active"
              style=${styleMap({ transform: `scaleX(${this.progressPosition})` })}
            ></div>
          </div>
          <button
            class="handler"
            style=${styleMap({ left: this.progressPosition * 100 + '%' })}
          ></button>
        </div>
      </div>
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
