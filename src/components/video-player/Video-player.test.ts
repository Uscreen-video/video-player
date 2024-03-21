import { html, fixture, expect } from "@open-wc/testing";
import type { VideoPlayer } from "./Video-player.component";

describe.skip("video-player", () => {
  it("with default parameters", async () => {
    const el: VideoPlayer = await fixture(html`<video-player></video-player>`);
    expect(el.disabled).equal(undefined);
  });
});
