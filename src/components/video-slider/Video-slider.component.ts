import { unsafeCSS, LitElement, html } from 'lit'
import { customElement, eventOptions, property, state } from 'lit/decorators.js'
import styles from './Video-slider.styles.css?inline'
import { styleMap } from 'lit/directives/style-map.js'
import { eventCode, emit } from '../../helpers/event'

@customElement('video-slider')
export class VideoSlider extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: Number })
  value = 0

  @property({ type: Boolean, attribute: 'full-width', reflect: true })
  fullWidth = false

  @state()
  position = 0

  @state()
  isDragging = false

  @state()
  isHovered = false

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

  handleNavigation = (e: KeyboardEvent) => {
    if (eventCode(e, 'arrowRight', 'arrowLeft')) {
      const position = eventCode(e, 'arrowLeft') ? -0.1 : 0.1
      this.position += Math.min(Math.max(this.position + position, 0), 1)
      e.stopPropagation()
      emit(this, 'dragend')
    }
  }

  /**
   * When user releases the timeline we think the dragging is over
   */
  handlePointerRelease = () => {
    if (this.isDragging) emit(this, 'dragend')
    this.isDragging = false
  }

  /**
   * We track pointer movement by the X coord 
   * if user hover the line or start started its dragging
   */
  handlePointerMove = (e: PointerEvent & TouchEvent) =>{
    if (!this.isDragging && !this.isHovered) return
    const eventClientX = e.targetTouches?.[0]?.clientX || e.clientX
    const newPosition = this.getPinterPosition(eventClientX)

    if (newPosition === null) return

    this.position = newPosition
  }

  /**
   * If user pushed the screen or the button over the line
   * we think he started dragging
   */
  @eventOptions({ passive: false })
  handlePointerDown() {
    this.isDragging = true
    emit(this, 'dragstart')
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

  handleMouseUp = (e: PointerEvent & TouchEvent) => {
    e.preventDefault()
  }

  getPinterPosition(clientX: number) {
    const { x, width } = this.getBoundingClientRect()
    const leftBorder = x
    const rightBorder = x + width
    const newPosition = clientX - x

    if (clientX > rightBorder) return 1
    if (clientX < leftBorder || newPosition < 0) return 0
    return newPosition / width
  }

  get progressPosition() {
    return this.isDragging
      ? this.position
      : this.value
  }

  render() {
    return html`
      <div 
        class="container"
        role="slider"
        tabindex="0"
        aria-valuemin="0"
        aria-valuenow=${this.progressPosition}
        aria-valuemax="1"
        @keydown=${this.handleNavigation}
        @mouseenter=${this.handlePointerEnter}
        @mouseleave=${this.handlePointerLeave}
        @mouseup=${this.handleMouseUp}
        @mousedown=${this.handlePointerDown}
        @touchstart=${this.handlePointerDown}
        @click=${this.handleLineClick}
      >
        <div class="lines">
          <div 
            class="progress"
            style=${styleMap({
              transform: `scaleX(${this.progressPosition})`
            })}
          ></div>
          <slot></slot>
        </div>
        <div
          class="handler"
          style=${styleMap({
            transform: `translateX(${this.progressPosition * 100 + '%'})`
          })}
        ></div>
      </div>
    `
  }
}
