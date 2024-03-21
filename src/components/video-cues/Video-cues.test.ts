import { html, fixture, expect } from "@open-wc/testing";
import type { VideoCues } from "./Video-cues.component";

describe("video-cues", () => {
  it("with default parameters", async () => {
    const el: VideoCues = await fixture(html`<video-cues></video-cues>`);
    expect(el.disabled).equal(undefined);
  });
});
