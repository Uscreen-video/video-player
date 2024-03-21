import { html, fixture, expect } from "@open-wc/testing";
import { VideoSlider } from "./Video-slider.component";
import { nextFrame } from "@open-wc/testing-helpers";

describe("video-slider", () => {
  it("renders default slider correctly", async () => {
    const el = await fixture<VideoSlider>(html`<video-slider></video-slider>`);
    expect(el).to.exist;
    expect(el.shadowRoot.querySelector(".slider")).to.exist;
  });

  it("disables slider when disabled attribute is set", async () => {
    const el = await fixture<VideoSlider>(
      html`<video-slider disabled></video-slider>`,
    );
    expect(el.disabled).to.be.true;
    expect(el.shadowRoot.querySelector(".slider").disabled).to.be.true;
  });

  it("shows tooltip on mouseover when with-tooltip attribute is set", async () => {
    const el = await fixture<VideoSlider>(
      html`<video-slider with-tooltip></video-slider>`,
    );
    el.dispatchEvent(new MouseEvent("mouseover"));
    await nextFrame();
    const tooltip = el.shadowRoot.querySelector(".tooltip");
    expect(tooltip).to.exist;
  });

  // Add more tests for other functionalities as needed
});
