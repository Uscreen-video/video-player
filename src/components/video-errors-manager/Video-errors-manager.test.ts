import { html, fixture, expect } from "@open-wc/testing";
import type { VideoErrorsManager } from "./Video-errors-manager.component";

describe("video-errors-manager", () => {
  it("with default parameters", async () => {
    const el: VideoErrorsManager = await fixture(
      html`<video-errors-manager></video-errors-manager>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
