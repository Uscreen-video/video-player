import { html, fixture, expect } from "@open-wc/testing";
import type { VideoChromecast } from "./Video-chromecast.component";

/**
 * The remote player belongs to the cast framework, which is never loaded in the
 * test environment, so the element is handed a stub of the pair it drives. It
 * is deliberately never connected: `disconnectedCallback` reaches for the
 * framework globals as soon as a controller is present.
 */
const withRemote = (isPaused: boolean) => {
  const el = document.createElement("video-chromecast") as VideoChromecast;
  let toggles = 0;
  Object.assign(el, {
    player: { isPaused },
    controller: { playOrPause: () => toggles++ },
  });
  return { el, toggled: () => toggles };
};

describe("video-chromecast", () => {
  it("with default parameters", async () => {
    const el: VideoChromecast = await fixture(
      html`<video-chromecast></video-chromecast>`,
    );
    expect(el.disabled).equal(undefined);
  });

  describe("driving a toggling remote player", () => {
    it("pauses a playing receiver", () => {
      const { el, toggled } = withRemote(false);
      el.pause();
      expect(toggled()).to.equal(1);
    });

    it("leaves a paused receiver alone on pause", () => {
      const { el, toggled } = withRemote(true);
      el.pause();
      expect(toggled()).to.equal(0);
    });

    it("plays a paused receiver", () => {
      const { el, toggled } = withRemote(true);
      el.play();
      expect(toggled()).to.equal(1);
    });

    it("leaves a playing receiver alone on play", () => {
      const { el, toggled } = withRemote(false);
      el.play();
      expect(toggled()).to.equal(0);
    });

    it("toggles either way on togglePlay", () => {
      const playing = withRemote(false);
      playing.el.togglePlay();
      expect(playing.toggled()).to.equal(1);

      const paused = withRemote(true);
      paused.el.togglePlay();
      expect(paused.toggled()).to.equal(1);
    });
  });
});
