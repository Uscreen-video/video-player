import { html, fixture, expect } from "@open-wc/testing";
import type { VideoMenu } from "./Video-menu.component";

describe("video-menu", () => {
  it("with default parameters", async () => {
    const el: VideoMenu = await fixture(html`<video-menu></video-menu>`);
    expect(el.disabled).equal(undefined);
  });
});
