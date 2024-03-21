import { html, fixture, expect } from "@open-wc/testing";
import type { VideoTimer } from "./Video-timer.component";

describe("video-timer", () => {
  it("with default parameters", async () => {
    const el: VideoTimer = await fixture(html`<video-timer></video-timer>`);
    expect(el.disabled).equal(undefined);
  });
});
