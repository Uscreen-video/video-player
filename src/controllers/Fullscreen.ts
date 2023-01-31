import { ReactiveController, ReactiveElement } from "lit";
import { dispatch, Types } from "../state";

const fullscreenProperties = (() => {
  if (document.exitFullscreen) {
    return null
  }

  const prefix = ['webkit', 'moz', 'ms'].find(
    item => !!(document as any)[`${item}ExitFullscreen`] || !!(document as any)[`${item}CancelFullScreen`],
  )

  return {
    prefix,
    property: prefix === 'moz' ? 'FullScreen' : 'Fullscreen',
  }
})()


export class FullscreenController implements ReactiveController {
  container: Element
  video: HTMLVideoElement

  constructor(
    protected host: ReactiveElement & { fullscreenContainer: Element | string },
  ) {
    this.host.addController(this)
  }

  hostConnected(): void {
    const { fullscreenContainer } = this.host
    this.container = typeof fullscreenContainer === 'string'
      ? document.querySelector(fullscreenContainer)
      : this.host
    
    this.video = this.host.querySelector('video')
    
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange)
    this.handleFullscreenChange()
  }

  hostDisconnected(): void {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange)
  }
  
  private fullscreenNodesMatching(target?: Element) {
    return Boolean(target === this.video || target === this.container)
  }


  private handleFullscreenChange = (e?: Event & { target: Element }) => {
    if (
      this.fullscreenNodesMatching(document.fullscreenElement) ||
      this.fullscreenNodesMatching(e?.target)
    ) {
      dispatch(this.host, Types.Action.fullscreenChange, {
        isFullscreen: Boolean(
          document.fullscreenElement ||
          (document as any).webkitIsFullScreen ||
          (document as any).mozFullScreen
        )
      })
    }
  }

  public enter() {
    let fx = 'requestFullscreen'
    const element: any = this.container
    const _document: any = document

    if (fullscreenProperties) {
      const { prefix, property } = fullscreenProperties
      fx = `${prefix}Request${property}`
    }

    if (element[fx]) {
      return element[fx].call(element)
    }

    if (_document[fx]) {
      return _document[fx].call(document)
    }
  }

  public exit() {
    let fx = 'exitFullscreen'
    const element: any = this.container
    const _document: any = document

    if (fullscreenProperties) {
      const { prefix, property } = fullscreenProperties
      fx = `${prefix}Exit${property}`
    }

    if (element[fx]) {
      return element[fx].call(element)
    }

    if (_document[fx]) {
      return _document[fx].call(document)
    }
  }
}
