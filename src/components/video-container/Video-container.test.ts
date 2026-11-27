import { html, fixture, expect, elementUpdated } from "@open-wc/testing";
import type { VideoContainer } from "./Video-container.component";
import type { VideoPlayer } from "../video-player/Video-player.component";
import { Command, KeySystems } from "../../types";

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

describe("blocked storage", () => {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");
  let container: VideoContainer;

  beforeEach(() =>
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    }),
  );

  afterEach(() => {
    container?.hls?.destroy();
    Object.defineProperty(window, "localStorage", original);
  });

  it("starts the player without saved preferences", async () => {
    const player: VideoPlayer = await fixture(html`
      <video-player storage-key="test:blocked">
        <video slot="video" preload="none" muted>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>
    `);
    await elementUpdated(player);
    container = player.shadowRoot.querySelector("video-container");

    expect(
      player.state.value.isSourceSupported,
      "setup() stopped before Action.init",
    ).to.not.equal(undefined);

    await container.initHls();
    await new Promise<void>((resolve, reject) => {
      container.hls.on("hlsManifestParsed" as any, () => resolve());
      setTimeout(() => reject(new Error("the manifest was never parsed")), 2000);
    });
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

  // A pending `Command.init` is released in the same task as a fresh one, so
  // the two initialisations can start before either has stored its teardown
  it("keeps one key handler when initialisation overlaps", async () => {
    const container = await mountContainer();
    const listeners = trackEncryptedListeners(container.videos[0]);

    await Promise.all([container.initNative(), container.initNative()]);

    expect(listeners.size).to.equal(1);
  });
});

describe("autoplay", () => {
  let container: VideoContainer;

  afterEach(() => container?.hls?.destroy());

  const mount = async (player: VideoPlayer) => {
    await elementUpdated(player);
    container = player.shadowRoot.querySelector("video-container");
    const video = player.querySelector("video");
    let plays = 0;
    // Native playback is what `preload="none"` holds back, and the test
    // browser plays no HLS natively, so the engine is started by hand
    video.play = () => {
      plays++;
      return Promise.resolve();
    };
    return { player, video, plays: () => plays };
  };

  const mountAutoplay = () =>
    fixture<VideoPlayer>(html`
      <video-player>
        <video slot="video" preload="none" muted autoplay>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>
    `).then(mount);

  const mountPlain = () =>
    fixture<VideoPlayer>(html`
      <video-player>
        <video slot="video" preload="none" muted>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video>
      </video-player>
    `).then(mount);

  // `cloneNode` copies attributes, not playback state: a copy of the page that
  // carries `autoplay` starts the stream on its own, and WebKit plays it even
  // though it is in no document (CAT-2179)
  it("keeps the attribute out of the markup a copy would carry", async () => {
    const { player, video } = await mountAutoplay();

    expect(video.hasAttribute("autoplay")).to.equal(false);
    expect(video.hasAttribute("data-autoplay")).to.equal(true);
    expect(player.state.value.isAutoplay).to.equal(true);
    const copy = player.cloneNode(true) as HTMLElement;
    expect(copy.querySelector("video").hasAttribute("autoplay")).to.equal(
      false,
    );
  });

  // Under `preload="none"` nothing loads until something asks to play, so a
  // wait for `canplay` would never end
  it("starts playback once the source is enabled, without waiting to load", async () => {
    const { video, plays } = await mountAutoplay();
    expect(video.readyState, "the video loaded by itself").to.equal(0);

    await container.initNative();

    expect(plays()).to.equal(1);
  });

  it("leaves a video the markup never asked to autoplay alone", async () => {
    const { player, plays } = await mountPlain();

    await container.initNative();

    expect(plays()).to.equal(0);
    expect(player.state.value.isAutoplay).to.equal(false);
  });

  // The browser clears its autoplaying flag on the first pause, and a viewer
  // who gets there before playback has begun must not be overruled
  it("gives up once the viewer has paused", async () => {
    const { player, plays } = await mountAutoplay();

    player.command(Command.pause);
    await container.initNative();

    expect(plays()).to.equal(0);
  });

  // `setup()` runs again on every `slotchange`, and custom content added to a
  // forwarded slot is enough to cause one
  it("keeps the request through a repeated setup", async () => {
    const { player, plays } = await mountAutoplay();

    container.setup();

    expect(player.state.value.isAutoplay).to.equal(true);
    await container.initNative();
    expect(plays()).to.equal(1);
  });

  it("does not play again after a repeated setup if the viewer paused", async () => {
    const { player, plays } = await mountAutoplay();

    player.command(Command.pause);
    container.setup();
    await container.initNative();

    expect(plays()).to.equal(0);
  });
});
