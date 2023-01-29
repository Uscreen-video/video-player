import { unsafeCSS, LitElement, html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, query, state } from 'lit/decorators.js'
import styles from './Video-timeline.styles.css?inline'
import { connect } from '../../state'

/**
 * @slot - Video-timeline main content
 * */
@customElement('video-timeline')
export class VideoTimeline extends LitElement {
  static styles = unsafeCSS(styles)

  @connect('duration')
  duration: number

  @connect('currentTime')
  currentTime: number

  @state()
  isHovered = false

  @state()
  draggingPosition = 0

  @state()
  handlerDraggingPosition = 0

  @state()
  tooltipDraggingPosition = 0

  @state()
  isDragging = false

  @query('.line-container')
  line: HTMLDivElement

  handleLineMouseEnter() {
    this.isHovered = true
  }

  handleLineMouseLeave() {
    this.isHovered = false
  }

  handleMouseUp(e: PointerEvent) {
    e.preventDefault()
  }

  handleTimeLineMouseMove({ clientX }: PointerEvent) {
    const newPosition = this.getTooltipPositionPercent(clientX)

    if (newPosition === null) return

    this.draggingPosition = newPosition
  }

  getTooltipPositionPercent(clientX: number) {
    const { x, width } = this.line.getBoundingClientRect()
    const leftBorder = x
    const rightBorder = x + width
    const newPosition = clientX - x

    if (
      clientX < leftBorder ||
      clientX > rightBorder ||
      newPosition < 0
    ) return null


    return (100 / width) * newPosition
  }

  setDraggingPosition({ targetTouches, clientX }: TouchEvent & PointerEvent) {
    const eventClientX = targetTouches?.[0]?.clientX || clientX
    const newPosition = this.getTooltipPositionPercent(eventClientX)

    if (newPosition === null) return
    this.handlerDraggingPosition = newPosition
    this.tooltipDraggingPosition = newPosition
  }

  onLineClick({ offsetX }: PointerEvent) {
    if (this.isDragging) {
      this.isDragging = false
      return
    }

    const percentage = offsetX / this.line.clientWidth
    const seekTo = Math.round(this.duration * percentage)

    // this.$core.call(CORE_EVENTS.SEEK_END)
    // this.$core.call(CORE_EVENTS.SEEK, { payload: seekTo })
  }

  handleHandleMouseDown() {
    this.isDragging = true

  }

  get timelineProgressWidth() {
    const { duration, currentTime } = this
    if (!currentTime || !duration) {
      return 0
    }
    if (currentTime >= duration) {
      return 1
    }
    return currentTime / duration
  }

  render() {
    return html`
      <div 
        class="container"
        @mouseenter=${this.handleLineMouseEnter}
        @mouseleave=${this.handleLineMouseLeave}
        @mousemove=${this.handleTimeLineMouseMove}
        @mouseup=${this.handleMouseUp}
        @click=${this.onLineClick}
      >
        <div class="line-container">
          <div class="line-background">
            <div 
              class="line-active"
              style="transform: scaleX(${this.timelineProgressWidth})"
            ></div>
          </div>
          <button 
            class="handler"
            @mousedown=${this.handleHandleMouseDown}
            @touchstart=${this.handleHandleMouseDown}
          ></button>
        </div>
      </div>
    `
  }
}
