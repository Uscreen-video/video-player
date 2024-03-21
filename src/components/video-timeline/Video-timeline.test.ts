import { html, fixture, expect } from "@open-wc/testing";
import type { VideoTimeline } from "./Video-timeline.component";

describe.skip("video-timeline", () => {
  it("with default parameters", async () => {
    const el: VideoTimeline = await fixture(
      html`<video-timeline></video-timeline>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
