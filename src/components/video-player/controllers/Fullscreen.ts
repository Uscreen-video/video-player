import { ReactiveController } from "lit";
import { dispatch, Types } from "../../../state";
import { VideoPlayer } from "../Video-player.component";

export class FullscreenController implements ReactiveController {
  container: Element;
  video: HTMLVideoElement;
  fullscreenProperties: null | {
    prefix: string;
    property: string;
  };

  constructor(
    protected host: VideoPlayer & { fullscreenContainer: Element | string },
  ) {
    this.host.addController(this);
  }

  hostConnected(): void {
    const { fullscreenContainer } = this.host;
    this.container =
      typeof fullscreenContainer === "string"
        ? document.querySelector(fullscreenContainer)
        : this.host;

    this.video = this.host.querySelector("video");
    this.fullscreenProperties = this.getFullscreenProperties(this.video);

    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.addEventListener(
      "webkitfullscreenchange",
      this.handleFullscreenChange,
    );
    document.addEventListener(
      "mozfullscreenchange",
      this.handleFullscreenChange,
    );
    this.video.addEventListener(
      "webkitbeginfullscreen",
      this.handleFullscreenChange,
    );
    this.video.addEventListener(
      "webkitendfullscreen",
      this.handleFullscreenChange,
    );
    this.handleFullscreenChange();
  }

  hostDisconnected(): void {
    document.removeEventListener(
      "fullscreenchange",
      this.handleFullscreenChange,
    );
    document.removeEventListener(
      "webkitfullscreenchange",
      this.handleFullscreenChange,
    );
    document.removeEventListener(
      "mozfullscreenchange",
      this.handleFullscreenChange,
    );
    this.video.removeEventListener(
      "webkitbeginfullscreen",
      this.handleFullscreenChange,
    );
    this.video.removeEventListener(
      "webkitendfullscreen",
      this.handleFullscreenChange,
    );
  }

  private fullscreenNodesMatching(target?: Element) {
    return Boolean(target === this.video || target === this.container);
  }

  private handleFullscreenChange = (e?: Event & { target: Element }) => {
    if (
      this.fullscreenNodesMatching(document.fullscreenElement) ||
      this.fullscreenNodesMatching(e?.target)
    ) {
      const isFullscreen = Boolean(
        document.fullscreenElement ||
          (document as any).webkitIsFullScreen ||
          (document as any).mozFullScreen ||
          (document as any).webkitCurrentFullScreenElement,
      );

      if (this.host.state.value?.isIos) {
        this.toggleIosFullscreen(e.type === "webkitbeginfullscreen");
      }

      dispatch(this.host, Types.Action.fullscreenChange, { isFullscreen });
    }
  };

  public enter() {
    let fx = "requestFullscreen";
    const element: any = this.container;
    const _document: any = document;
    const video: any = this.video;

    if (this.fullscreenProperties) {
      const { prefix, property } = this.fullscreenProperties;
      fx = `${prefix}Request${property}`;
    }

    if (element[fx]) {
      return element[fx].call(element);
    }

    // Safari on IOS allows to fullscreen only video element
    if (video.webkitEnterFullScreen) {
      return video.webkitEnterFullScreen({
        navigationUI: "hide",
      });
    }

    if (_document[fx]) {
      return _document[fx].call(document);
    }
  }

  public exit() {
    let fx = "exitFullscreen";
    const element: any = this.container;
    const _document: any = document;

    if (this.fullscreenProperties) {
      const { prefix, property } = this.fullscreenProperties;
      fx = `${prefix}Exit${property}`;
    }

    if (element[fx]) {
      return element[fx].call(element);
    }

    if (_document[fx]) {
      return _document[fx].call(document);
    }
  }

  /**
   * A dirty hack for IOS browsers:
   * Safari resets video attributes when exiting from fullscreen by swiping video down
   */
  toggleIosFullscreen(isFullscreen: boolean) {
    this.video.setAttribute("controls", "true");
    this.video.removeAttribute("playsinline");
    setTimeout(() => {
      this.video.setAttribute("playsinline", "true");
    });
    if (!isFullscreen)
      requestAnimationFrame(() => {
        this.video.removeAttribute("controls");
      });
  }

  getFullscreenProperties = (element: HTMLVideoElement) => {
    if (document.exitFullscreen) return null;

    const prefix = ["webkit", "moz", "ms"].find(
      (item) =>
        !!(element as any)[`${item}ExitFullscreen`] ||
        !!(document as any)[`${item}CancelFullScreen`],
    );

    return {
      prefix,
      property: prefix === "moz" ? "FullScreen" : "Fullscreen",
    };
  };
}
