import { html, fixture, expect } from "@open-wc/testing";
import type { VideoTimeline } from "./Video-timeline.component";
import "./Video-timeline.component";

describe("<ds-video-timeline>", () => {
  it("with default parameters", async () => {
    const el: VideoTimeline = await fixture(
      html`<ds-video-timeline></ds-video-timeline>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
