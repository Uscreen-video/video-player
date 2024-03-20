import { html, fixture, expect } from "@open-wc/testing";
import type { VideoContainer } from "./Video-container.component";
import "./Video-container.component";

describe("<ds-video-container>", () => {
  it("with default parameters", async () => {
    const el: VideoContainer = await fixture(
      html`<ds-video-container></ds-video-container>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
