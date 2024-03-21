import { html, fixture, expect } from "@open-wc/testing";
import type { VideoButton } from "./Video-button.component";

describe("video-button", () => {
  it("with default parameters", async () => {
    const el: VideoButton = await fixture(html`<video-button></video-button>`);
    expect(el.disabled).equal(undefined);
  });
});
