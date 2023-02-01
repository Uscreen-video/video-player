import { unsafeCSS, LitElement, html } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './Video-slider.styles.css?inline'
import { styleMap } from 'lit/directives/style-map.js'
import { emit } from '../../helpers/emit'

/**
 * @slot - Video-slider main content
 * */
@customElement('video-slider')
export class VideoSlider extends LitElement {
  static styles = unsafeCSS(styles)

  @property({ type: Number })
  value = 0

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
  handlePointerMove = ({ clientX, targetTouches }: PointerEvent & TouchEvent) =>{
    if (!this.isDragging && !this.isHovered) return
    const eventClientX = targetTouches?.[0]?.clientX || clientX
    const newPosition = this.getPinterPosition(eventClientX)

    if (newPosition === null) return

    this.position = newPosition
  }

  /**
   * If user pushed the screen or the button over the line
   * we think he started dragging
   */
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
