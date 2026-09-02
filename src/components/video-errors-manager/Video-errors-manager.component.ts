import { unsafeCSS, LitElement, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import styles from "./Video-errors-manager.styles.css?inline";
import { Types, connect, createCommand, dispatch, listen } from "../../state";

@customElement("video-errors-manager")
export class VideoErrorsManager extends LitElement {
  static styles = unsafeCSS(styles);
  public command = createCommand(this);

  timer = 0;

  /**
   * The timeout duration (in milliseconds) for displaying error messages before clearing.
   * If set to 0, error messages will persist until manually cleared.
   */
  @property({ type: Number })
  timeout = 10000;

  @connect("src")
  src: string;

  @connect("isPlaying")
  isPlaying: boolean;

  @connect("currentTime")
  currentTime: number;

  @connect("drmHelpUrl")
  drmHelpUrl: string;

  @connect("isInAppBrowser")
  isInAppBrowser: boolean;

  @state()
  message: string | TemplateResult<any> = "";

  printedAt = 0;

  willUpdate() {
    // A failure the viewer got past should not stay on screen: playing beyond
    // the point it was reported at means playback recovered, while a stall
    // keeps the message since `currentTime` stops moving
    if (this.message && this.isPlaying && this.currentTime > this.printedAt) {
      this.clear();
    }
  }

  @listen(Types.Command.error)
  handleErrors(error: Types.PlayerError) {
    if (error.drm) {
      return this.print(this.drmMessage(error), true);
    }

    if (error.message) this.print(error.message);
    if (error.code === MediaError.MEDIA_ERR_NETWORK) {
      const failedAt = this.currentTime;
      dispatch(this, Types.Action.update, { canPlay: false });
      this.requestSrc(5)
        .then(() => {
          dispatch(this, Types.Action.update, { canPlay: true });
          // Playback that moved on by itself must not be interrupted
          if (this.currentTime === failedAt) this.command(Types.Command.reload);
        })
        .catch(() =>
          this.print(
            html`The video could not be fetched after the maximum allowed
              connection attempts.<br />
              Please reload this page to try again.`,
            true,
          ),
        );
    }
  }

  // Never keyed on the browser version: the same version carries a working CDM
  // on one install and a broken one on another, only the failure itself tells
  drmMessage({ reason, status }: Types.PlayerError): TemplateResult<any> {
    switch (reason) {
      case "no-access":
        return html`This browser can't play protected video. Turn on protected
        content (DRM) in your browser settings, or open this page in Chrome,
        Firefox, Edge or
        Safari.${when(
          this.drmHelpUrl,
          () =>
            html`<br /><a href=${this.drmHelpUrl} target="_blank" rel="noopener"
                >How to turn it on</a
              >`,
        )}${when(
          this.isInAppBrowser,
          () =>
            html`<br />You're inside an app's built-in browser. Open this page
              in your regular browser.`,
        )}`;
      case "license-refused":
        return status >= 400 && status < 500
          ? html`The playback licence was refused.<br />
              Reload this page to request a new one.`
          : html`This video is protected and your browser's DRM component is out
              of date.<br />
              Update your browser, then reload this page.`;
      default:
        return html`This video is protected and its playback license could not
          be loaded.<br />
          Please reload this page to try again.`;
    }
  }

  clear = () => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = 0;
    this.message = "";
  };

  print = (message: string | TemplateResult<any>, persist = false) => {
    this.message = message;
    this.printedAt = this.currentTime;
    if (!persist) this.timer = setTimeout(this.clear, this.timeout);
  };

  requestSrc = async (attempts: number) => {
    if (!attempts) throw new Error("Video is not available");

    this.print(
      html`The video could not be loaded.<br />
        Attempting to establish a connection...`,
    );
    await new Promise((resolve) => setTimeout(resolve, this.timeout));
    const { ok } = await fetch(this.src);
    if (!ok) await this.requestSrc(attempts - 1);
  };

  render() {
    if (!this.message) return null;
    return html` <div>${this.message}</div> `;
  }
}
