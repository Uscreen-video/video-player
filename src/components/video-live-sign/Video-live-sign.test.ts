import { html, fixture, expect } from "@open-wc/testing";
import type { VideoLiveSign } from "./Video-live-sign.component";
import "./Video-live-sign.component";

describe("<ds-video-live-sign>", () => {
  it("with default parameters", async () => {
    const el: VideoLiveSign = await fixture(
      html`<ds-video-live-sign></ds-video-live-sign>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
