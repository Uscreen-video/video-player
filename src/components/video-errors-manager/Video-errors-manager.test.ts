import { html, fixture, expect } from "@open-wc/testing";
import type { VideoErrorsManager } from "./Video-errors-manager.component";
import "./Video-errors-manager.component";

describe("<ds-video-errors-manager>", () => {
  it("with default parameters", async () => {
    const el: VideoErrorsManager = await fixture(
      html`<ds-video-errors-manager></ds-video-errors-manager>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
