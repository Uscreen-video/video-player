import { html, fixture, expect } from "@open-wc/testing";
import type { VideoLiveSign } from "./Video-live-sign.component";

describe("video-live-sign", () => {
  it("with default parameters", async () => {
    const el: VideoLiveSign = await fixture(
      html`<video-live-sign></video-live-sign>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
