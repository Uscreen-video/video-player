import { html, fixture, expect } from "@open-wc/testing";
import type { VideoControls } from "./Video-controls.component";

describe("video-controls", () => {
  it("with default parameters", async () => {
    const el: VideoControls = await fixture(
      html`<video-controls></video-controls>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
