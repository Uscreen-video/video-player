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
});
