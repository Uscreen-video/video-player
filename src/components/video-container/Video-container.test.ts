import { html, fixture, expect } from "@open-wc/testing";
import type { VideoContainer } from "./Video-container.component";

describe("video-container", () => {
  it("with default parameters", async () => {
    const el: VideoContainer = await fixture(
      html`<video-container></video-container>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
