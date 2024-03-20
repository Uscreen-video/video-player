import { html, fixture, expect } from "@open-wc/testing";
import type { VideoChromecast } from "./Video-chromecast.component";
import "./Video-chromecast.component";

describe("<ds-video-chromecast>", () => {
  it("with default parameters", async () => {
    const el: VideoChromecast = await fixture(
      html`<ds-video-chromecast></ds-video-chromecast>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
