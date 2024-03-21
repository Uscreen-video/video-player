import { html, fixture, expect } from "@open-wc/testing";
import type { VideoProgress } from "./Video-progress.component";

describe("video-progress", () => {
  it("with default parameters", async () => {
    const el: VideoProgress = await fixture(
      html`<video-progress></video-progress>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
