import { html, fixture, expect } from "@open-wc/testing";
import type { VideoVolumeControl } from "./Video-volume-control.component";
import "./Video-volume-control.component";

describe("<ds-video-volume-control>", () => {
  it("with default parameters", async () => {
    const el: VideoVolumeControl = await fixture(
      html`<ds-video-volume-control></ds-video-volume-control>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
