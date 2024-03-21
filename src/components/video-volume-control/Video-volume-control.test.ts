import { html, fixture, expect } from "@open-wc/testing";
import type { VideoVolumeControl } from "./Video-volume-control.component";

describe("video-volume-control", () => {
  it("with default parameters", async () => {
    const el: VideoVolumeControl = await fixture(
      html`<video-volume-control></video-volume-control>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
