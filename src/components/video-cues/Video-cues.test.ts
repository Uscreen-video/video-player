import { html, fixture, expect } from "@open-wc/testing";
import type { VideoCues } from "./Video-cues.component";
import "./Video-cues.component";

describe("<ds-video-cues>", () => {
  it("with default parameters", async () => {
    const el: VideoCues = await fixture(html`<ds-video-cues></ds-video-cues>`);
    expect(el.disabled).equal(undefined);
  });
});
