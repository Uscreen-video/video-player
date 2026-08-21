import { html, fixture, expect } from "@open-wc/testing";
import type { VideoButton } from "./Video-button.component";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("video-button", () => {
  it("with default parameters", async () => {
    const el: VideoButton = await fixture(html`<video-button></video-button>`);
    expect(el.disabled).equal(undefined);
  });

  // Regression: focusing the button used to open the menu on a 100ms timer. A
  // pointer press focuses before the click arrives on release, so any press
  // held longer than that opened the menu and the click then closed it again —
  // the menu flashed and only opened on every second click. Opening is now the
  // click's job alone, for pointer and keyboard alike.
  it("opens the menu only on click, never on focus", async () => {
    const el: any = await fixture(
      html`<video-settings-button settings="quality"></video-settings-button>`,
    );
    el.qualityLevels = [{ name: "1080", height: 1080, badge: "HD" }];
    await el.updateComplete;

    el.shadowRoot.querySelector("button").focus();
    await wait(200);
    expect(el.menuPopper).to.equal(undefined);

    el.handleClick();
    expect(el.menuPopper).to.not.equal(undefined);

    el.handleClick();
    expect(el.menuPopper).to.equal(undefined);
  });
});
