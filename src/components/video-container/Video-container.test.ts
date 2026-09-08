import { html, fixture, expect, elementUpdated } from "@open-wc/testing";
import type { VideoContainer } from "./Video-container.component";
import type { VideoPlayer } from "../video-player/Video-player.component";
import { KeySystems } from "../../types";

describe("video-container", () => {
  it("with default parameters", async () => {
    const el: VideoContainer = await fixture(
      html`<video-container></video-container>`,
    );
    expect(el.disabled).equal(undefined);
  });
});

describe("automatic quality selection", () => {
  let container: VideoContainer;

  // The instance keeps retrying the mock fragment, which does not exist.
  afterEach(() => container?.hls?.destroy());

  /**
   * A player of a fixed size, with the source left lazy (`data-src`) so that
   * nothing initialises until the test asks for it — the cap is measured off
   * the element, so it has to be laid out before HLS starts.
   */
  const mountPlayer = async (width: string) => {
    const player: VideoPlayer = await fixture(html`
      <video-player style="display: block; width: ${width}">
        <video slot="video" preload="none" muted>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>
    `);
    await elementUpdated(player);
    container = player.shadowRoot.querySelector("video-container");
    expect(
      container.getBoundingClientRect().width,
      "the player has no size to measure",
    ).to.be.greaterThan(0);
    return container;
  };

  /**
   * The cap in force the moment the ladder becomes known — before any resize,
   * which is a second and much later way for it to be applied.
   */
  const capOnManifestParsed = async (el: VideoContainer) => {
    await el.initHls();
    const hls = el.hls;
    return new Promise<{ cap: number; heights: number[] }>(
      (resolve, reject) => {
        // "hlsManifestParsed", spelled out to keep hls.js out of the test
        hls.on("hlsManifestParsed" as any, () =>
          resolve({
            cap: hls.autoLevelCapping,
            heights: hls.levels.map(({ height }) => height),
          }),
        );
        const errors: string[] = [];
        hls.on("hlsError" as any, (_: unknown, d: any) =>
          errors.push(String(d.details)),
        );
        setTimeout(
          () =>
            reject(
              new Error(
                `the manifest was never parsed (${errors.join(", ") || "no errors reported"})`,
              ),
            ),
          2000,
        );
      },
    );
  };

  it("caps automatic selection to the player size", async () => {
    const el = await mountPlayer("320px");

    const { cap, heights } = await capOnManifestParsed(el);

    expect(cap, "automatic selection was left uncapped").to.not.equal(-1);
    expect(
      heights[cap],
      `a ${heights[cap]}p rendition was allowed into a 320px player`,
    ).to.be.at.most(720);
    expect(cap, "the top of the ladder was left reachable").to.be.below(
      heights.length - 1,
    );
  });

  it("caps automatic selection again when HLS is re-initialised", async () => {
    // The storefront re-initialises mid-session, and that is where capping
    // used to be skipped: hls.js measures the element when media is attached,
    // and on a re-init the element no longer changes size afterwards, so the
    // resize that would otherwise apply the cap never arrives.
    const el = await mountPlayer("320px");
    await capOnManifestParsed(el);

    const { cap, heights } = await capOnManifestParsed(el);

    expect(cap, "automatic selection was left uncapped").to.not.equal(-1);
    expect(heights[cap]).to.be.at.most(720);
  });
});

describe("FairPlay initialisation", () => {
  /**
   * Every live `encrypted` listener on the element, by identity — the handler
   * is attached by `initFairPlayDRM` and removed by the teardown it returns
   */
  const trackEncryptedListeners = (video: HTMLVideoElement) => {
    const live = new Set<unknown>();
    const add = video.addEventListener.bind(video);
    const remove = video.removeEventListener.bind(video);

    video.addEventListener = (type: string, listener: any, options?: any) => {
      if (type === "encrypted") live.add(listener);
      return add(type, listener, options);
    };
    video.removeEventListener = (
      type: string,
      listener: any,
      options?: any,
    ) => {
      if (type === "encrypted") live.delete(listener);
      return remove(type, listener, options);
    };

    return live;
  };

  const mountContainer = async () => {
    const player: VideoPlayer = await fixture(html`
      <video-player>
        <video slot="video" preload="none" muted>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>
    `);
    await elementUpdated(player);
    const container: VideoContainer =
      player.shadowRoot.querySelector("video-container");
    container.drmOptions = {
      [KeySystems.fps]: {
        licenseUrl: "https://license.test/license",
        certificateUrl: "https://license.test/certificate",
      },
    };
    return container;
  };

  // `Command.init` is re-dispatched on every `slotchange`, so a storefront that
  // swaps the source used to leave the previous key handler attached
  it("keeps one key handler across repeated initialisation", async () => {
    const container = await mountContainer();
    const listeners = trackEncryptedListeners(container.videos[0]);

    await container.initNative();
    await container.initNative();

    expect(listeners.size).to.equal(1);
  });
});
