import { html, fixture, expect } from "@open-wc/testing";
import type { VideoCondition } from "./Video-condition.component";

describe.skip("video-condition", () => {
  it("with default parameters", async () => {
    const el: VideoCondition = await fixture(
      html`<video-condition></video-condition>`,
    );
    expect(el.disabled).equal(undefined);
  });
});
