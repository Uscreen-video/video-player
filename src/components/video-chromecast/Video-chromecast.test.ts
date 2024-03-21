import { html, fixture, expect } from "@open-wc/testing";
import type { VideoChromecast } from "./Video-chromecast.component";

describe("video-chromecast", () => {
  it("with default parameters", async () => {
    const el: VideoChromecast = await fixture(
      html`<video-chromecast></video-chromecast>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
