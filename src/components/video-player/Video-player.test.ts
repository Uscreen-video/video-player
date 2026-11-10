import { html, fixture, expect, waitUntil } from "@open-wc/testing";
import type { VideoPlayer } from "./Video-player.component";
import { Command } from "../../types";

describe.skip("video-player", () => {
  it("with default parameters", async () => {
    const el: VideoPlayer = await fixture(html`<video-player></video-player>`);
    expect(el.disabled).equal(undefined);
  });
});

describe("video-player playback errors", () => {
  it("re-emits every error command as a `playback-error` DOM event", async () => {
    const el: VideoPlayer = await fixture(html`
      <video-player>
        <video slot="video" preload="none" muted>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>
    `);
    const events: CustomEvent[] = [];
    el.addEventListener("playback-error", (e) => events.push(e as CustomEvent));
    const error = {
      drm: true,
      reason: "license-refused",
      status: 500,
      details: "keySystemLicenseRequestFailed",
      keySystem: "com.widevine.alpha",
      cdmVersion: "4.10.2934.0",
    };

    el.command(Command.error, error);

    await waitUntil(() => events.length === 1);
    expect(events[0].detail).to.eql(error);
    expect(events[0].bubbles).to.equal(true);
    expect(events[0].composed).to.equal(true);
  });

  it("writes `drm-help-url` into state", async () => {
    const el: VideoPlayer = await fixture(
      html`<video-player drm-help-url="https://help.test/drm">
        <video slot="video" preload="none" muted>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>`,
    );

    expect(el.state.value.drmHelpUrl).to.equal("https://help.test/drm");
  });

  it("follows `drm-help-url` changes and clears state when it is removed", async () => {
    const el: VideoPlayer = await fixture(
      html`<video-player drm-help-url="https://help.test/drm">
        <video slot="video" preload="none" muted>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>`,
    );

    el.setAttribute("drm-help-url", "https://help.test/drm-2");
    await el.updateComplete;
    expect(el.state.value.drmHelpUrl).to.equal("https://help.test/drm-2");

    el.removeAttribute("drm-help-url");
    await el.updateComplete;
    expect(el.state.value.drmHelpUrl).to.equal(undefined);
  });
});

describe("video-player video re-creation after adoption", () => {
  const SAFARI_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Safari/605.1.15";
  const CHROME_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";

  let container: HTMLElement;

  const stubUserAgent = (ua: string) =>
    Object.defineProperty(navigator, "userAgent", {
      value: ua,
      configurable: true,
    });

  const appendFromTemplate = () => {
    const template = document.createElement("template");
    template.innerHTML = `
      <video-player>
        <video slot="video" preload="none" muted data-target="video">
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>
    `;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const video = fragment.querySelector("video")!;
    container.append(fragment);
    return {
      el: container.querySelector("video-player") as VideoPlayer,
      originalVideo: video,
    };
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
  });

  afterEach(() => {
    delete (navigator as { userAgent?: string }).userAgent;
    container.remove();
  });

  it("replaces the slotted video with a copy when the browser plays HLS natively", () => {
    stubUserAgent(SAFARI_UA);
    const { el, originalVideo } = appendFromTemplate();

    const video = el.querySelector("video")!;
    expect(video).not.to.equal(originalVideo);
    expect(originalVideo.isConnected).to.equal(false);
    expect(video.getAttribute("slot")).to.equal("video");
    expect(video.dataset.target).to.equal("video");
    expect(video.querySelector("source")?.dataset.src).to.equal(
      "/mocks/master.m3u8",
    );
  });

  it("keeps the video when the same player is appended again", () => {
    stubUserAgent(SAFARI_UA);
    const { el } = appendFromTemplate();
    const video = el.querySelector("video");

    container.append(el);

    expect(el.querySelector("video")).to.equal(video);
  });

  it("keeps the video when the browser plays HLS with hls.js", () => {
    stubUserAgent(CHROME_UA);
    const { el, originalVideo } = appendFromTemplate();

    expect(el.querySelector("video")).to.equal(originalVideo);
  });
});
