import { html, fixture, expect, elementUpdated } from "@open-wc/testing";
import type { VideoErrorsManager } from "./Video-errors-manager.component";
import type { VideoPlayer } from "../video-player/Video-player.component";
import { Action, Command, PlayerError } from "../../types";

const HELP_URL = "https://help.test/drm";

/**
 * The manager reads state and receives commands through `<video-player>`, so
 * it is exercised as the player's default `errors` slot content
 */
const mount = async () => {
  const player: VideoPlayer = await fixture(
    html`<video-player>
      <video slot="video" preload="none" muted>
        <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
      </video>
    </video-player>`,
  );
  const manager: VideoErrorsManager = player.shadowRoot.querySelector(
    "video-errors-manager",
  );
  return { player, manager };
};

const mountWithHelp = async () => {
  const player: VideoPlayer = await fixture(
    html`<video-player drm-help-url=${HELP_URL}>
      <video slot="video" preload="none" muted>
        <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
      </video>
    </video-player>`,
  );
  const manager: VideoErrorsManager = player.shadowRoot.querySelector(
    "video-errors-manager",
  );
  return { player, manager };
};

const report = async (
  player: VideoPlayer,
  manager: VideoErrorsManager,
  error: PlayerError,
) => {
  player.command(Command.error, error);
  await elementUpdated(manager);
  return manager.shadowRoot.textContent.replace(/\s+/g, " ").trim();
};

describe("video-errors-manager", () => {
  it("with default parameters", async () => {
    const el: VideoErrorsManager = await fixture(
      html`<video-errors-manager></video-errors-manager>`,
    );
    expect(el.message).to.equal("");
  });

  describe("DRM failures", () => {
    it("explains a missing key system and links the help page", async () => {
      const { player, manager } = await mountWithHelp();

      const text = await report(player, manager, {
        drm: true,
        reason: "no-access",
      });

      expect(text).to.contain("This browser can't play protected video");
      expect(text).to.contain("How to turn it on");
      const link = manager.shadowRoot.querySelector("a");
      expect(link.getAttribute("href")).to.equal(HELP_URL);
      expect(link.getAttribute("target")).to.equal("_blank");
      expect(link.getAttribute("rel")).to.equal("noopener");
      expect(text).not.to.contain("built-in browser");
    });

    it("omits the link when no help page is configured", async () => {
      const { player, manager } = await mount();

      const text = await report(player, manager, {
        drm: true,
        reason: "no-access",
      });

      expect(text).to.contain("This browser can't play protected video");
      expect(manager.shadowRoot.querySelector("a")).to.equal(null);
    });

    it("adds the in-app browser hint when the page runs inside one", async () => {
      const { player, manager } = await mount();
      player.state.setState(Action.update, { isInAppBrowser: true });

      const text = await report(player, manager, {
        drm: true,
        reason: "no-access",
      });

      expect(text).to.contain("This browser can't play protected video");
      expect(text).to.contain(
        "You're inside an app's built-in browser. Open this page in your regular browser.",
      );
    });

    it("asks for a browser update when the license server refuses with a 5xx", async () => {
      const { player, manager } = await mount();

      const text = await report(player, manager, {
        drm: true,
        reason: "license-refused",
        status: 500,
      });

      expect(text).to.contain("DRM component is out of date");
      expect(text).to.contain("Update your browser, then reload this page");
    });

    it("asks for a browser update when the license failed without a status", async () => {
      const { player, manager } = await mount();

      const text = await report(player, manager, {
        drm: true,
        reason: "license-refused",
      });

      expect(text).to.contain("DRM component is out of date");
    });

    it("asks for a reload when the license server refuses with a 4xx", async () => {
      const { player, manager } = await mount();

      const text = await report(player, manager, {
        drm: true,
        reason: "license-refused",
        status: 403,
      });

      expect(text).to.contain("The playback licence was refused");
      expect(text).to.contain("Reload this page to request a new one");
      expect(text).not.to.contain("out of date");
    });

    it("keeps the generic text for any other key-system failure", async () => {
      const { player, manager } = await mount();

      const text = await report(player, manager, {
        drm: true,
        reason: "unknown",
        details: "keySystemSessionUpdateFailed",
      });

      expect(text).to.contain(
        "This video is protected and its playback license could not be loaded",
      );
    });

    it("persists the message instead of clearing it after the timeout", async () => {
      const { player, manager } = await mount();
      manager.timeout = 10;

      await report(player, manager, { drm: true, reason: "no-access" });
      await new Promise((resolve) => setTimeout(resolve, 30));
      await elementUpdated(manager);

      expect(manager.timer).to.equal(0);
      expect(manager.shadowRoot.textContent).to.contain(
        "This browser can't play protected video",
      );
    });
  });
});
