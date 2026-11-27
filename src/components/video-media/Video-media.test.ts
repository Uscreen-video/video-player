import { html, fixture, expect, elementUpdated } from "@open-wc/testing";
import type { VideoMedia } from "./Video-media.component";
import type { VideoPlayer } from "../video-player/Video-player.component";
import type { VideoContainer } from "../video-container/Video-container.component";
import { Action } from "../../types";

const microtask = () => Promise.resolve();

// `slotchange` is reported after the removal, on its own turn
const slotChanged = () => new Promise((resolve) => setTimeout(resolve));

const MARKUP = `
  <video-media slot="video" id="media" class="page" data-target="video"
    preload="none" muted autoplay playsinline poster="/mocks/poster.jpg">
    <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
    <track label="English" kind="metadata" srclang="en" src="/mocks/captions_jp.vtt" />
  </video-media>
`;

describe("video-media", () => {
  let wrapper: HTMLElement;

  const mount = () => {
    wrapper.innerHTML = MARKUP;
    return wrapper.querySelector("video-media") as VideoMedia;
  };

  beforeEach(() => {
    wrapper = document.createElement("div");
    document.body.append(wrapper);
  });

  afterEach(() => wrapper.remove());

  it("creates the video in its shadow root when it is in the document", () => {
    const el = mount();

    const video = el.shadowRoot.querySelector("video");
    expect(video).to.equal(el.video);
    expect(el.querySelector("video")).to.equal(null);
    expect(video.muted).to.equal(true);
    expect(video.autoplay).to.equal(true);
    expect(video.getAttribute("poster")).to.equal("/mocks/poster.jpg");
    expect(video.hasAttribute("playsinline")).to.equal(true);
    expect(video.querySelector("track").srclang).to.equal("en");
  });

  it("keeps the attributes that belong to the page off the video", () => {
    const { video } = mount();

    ["id", "class", "slot", "data-target"].forEach((name) =>
      expect(video.hasAttribute(name), name).to.equal(false),
    );
  });

  it("gives the video no source of its own", () => {
    const { video } = mount();

    expect(video.querySelector("source")).to.equal(null);
    expect(video.hasAttribute("src")).to.equal(false);
  });

  it("leaves a copy made by `cloneNode` without a video", async () => {
    const el = mount();

    const copy = el.cloneNode(true) as VideoMedia;
    await microtask();

    expect(copy.shadowRoot).to.equal(null);
    expect(copy.video).to.equal(null);
    expect(copy.querySelector("video")).to.equal(null);
    expect(copy.hasAttribute("autoplay")).to.equal(true);
  });

  it("creates no video while it is outside the document", async () => {
    const template = document.createElement("template");
    template.innerHTML = MARKUP;
    const el = document.importNode(template.content, true)
      .firstElementChild as VideoMedia;

    el.setAttribute("autoplay", "");
    el.play().catch(() => undefined);
    el.currentTime = 5;
    await microtask();

    expect(el.video).to.equal(null);
    expect(el.shadowRoot).to.equal(null);
  });

  it("removes the video when it leaves the document", async () => {
    const el = mount();
    const video = el.video;
    const changes: (HTMLVideoElement | null)[] = [];
    wrapper.addEventListener("video-media-change", (e) =>
      changes.push((e as CustomEvent).detail.video),
    );

    el.remove();
    await microtask();

    expect(el.video).to.equal(null);
    expect(el.shadowRoot.querySelector("video")).to.equal(null);
    expect(video.hasAttribute("autoplay")).to.equal(false);
    expect(video.paused).to.equal(true);
    expect(changes).to.eql([]);
  });

  it("tells its ancestors when the video is removed", async () => {
    const el = mount();
    const video = el.video;
    const details: { video: unknown; previous?: unknown }[] = [];
    const parent = el.parentElement;
    parent.addEventListener("video-media-change", (e) =>
      details.push((e as CustomEvent).detail),
    );

    parent.remove();
    await microtask();

    expect(details).to.eql([{ video: null, previous: video }]);
  });

  it("creates a new video when it returns to the document", async () => {
    const el = mount();
    const first = el.video;

    el.remove();
    await microtask();
    wrapper.append(el);

    expect(el.video).not.to.equal(first);
    expect(el.video.isConnected).to.equal(true);
    expect(el.shadowRoot.querySelectorAll("video").length).to.equal(1);
  });

  it("keeps the video through a move inside the document", async () => {
    const el = mount();
    const video = el.video;
    const target = document.createElement("section");
    wrapper.append(target);

    target.append(el);
    await microtask();

    expect(el.video).to.equal(video);
  });

  it("follows attribute changes on the host", async () => {
    const el = mount();

    el.setAttribute("loop", "");
    el.removeAttribute("autoplay");
    el.setAttribute("data-later", "1");
    await microtask();

    expect(el.video.loop).to.equal(true);
    expect(el.video.autoplay).to.equal(false);
    expect(el.video.hasAttribute("data-later")).to.equal(false);
  });

  it("follows attribute changes on a track", async () => {
    const el = mount();
    // The player listens to the `TextTrack` behind this element, so the copy
    // has to be patched in place rather than replaced
    const copy = el.video.querySelector("track");

    el.querySelector("track").setAttribute("src", "/mocks/captions_en.vtt");
    el.querySelector("track").setAttribute("label", "English (CC)");
    await microtask();

    expect(el.video.querySelector("track")).to.equal(copy);
    expect(copy.getAttribute("src")).to.equal("/mocks/captions_en.vtt");
    expect(copy.label).to.equal("English (CC)");
  });

  it("dispatches the media events of the video on itself", () => {
    const el = mount();
    const seen: EventTarget[] = [];
    el.addEventListener("timeupdate", (e) => seen.push(e.target));

    el.video.dispatchEvent(new Event("timeupdate"));

    expect(seen).to.eql([el]);
  });

  it("reads and writes playback state through the video", () => {
    const el = mount();

    el.volume = 0.25;

    expect(el.video.volume).to.equal(0.25);
    expect(el.paused).to.equal(true);
    expect(el.muted).to.equal(true);
    expect(Number.isNaN(el.duration)).to.equal(true);
  });
});

describe("video-player with video-media", () => {
  let container: VideoContainer;

  afterEach(() => container?.hls?.destroy());

  const mountPlayer = async () => {
    const player: VideoPlayer = await fixture(html`
      <video-player style="display: block; width: 320px">
        <video-media slot="video" preload="none" muted>
          <source data-src="/mocks/master.m3u8" type="application/x-mpegURL" />
        </video-media>
      </video-player>
    `);
    await elementUpdated(player);
    container = player.shadowRoot.querySelector("video-container");
    return { player, media: player.querySelector("video-media") as VideoMedia };
  };

  it("plays the video that video-media holds", async () => {
    const { player, media } = await mountPlayer();

    expect(container.videos).to.eql([media.video]);
    expect(player.fullscreen.video).to.equal(media.video);
    expect(player.state.value.src).to.equal("/mocks/master.m3u8");
    expect(media.getBoundingClientRect().height).to.be.greaterThan(0);
    expect(media.video.getBoundingClientRect().height).to.equal(
      media.getBoundingClientRect().height,
    );
  });

  it("reads a renewed source from the page markup", async () => {
    const { media } = await mountPlayer();

    media.querySelector("source").src = "/mocks/renewed.m3u8";

    expect(container.sources.getSrc()).to.match(/\/mocks\/renewed\.m3u8$/);
  });

  it("drops the engine with the video, and starts again with the next video", async () => {
    const { player, media } = await mountPlayer();
    const parent = player.parentElement;
    await container.initHls();
    const firstEngine = container.hls;
    const firstVideo = media.video;

    player.remove();
    await microtask();

    expect(container.hls).to.equal(undefined);
    expect(player.fullscreen.video).to.equal(null);

    parent.append(player);
    await elementUpdated(player);

    expect(media.video).not.to.equal(firstVideo);
    expect(container.videos).to.eql([media.video]);
    expect(player.fullscreen.video).to.equal(media.video);
    expect(firstEngine).not.to.equal(undefined);
  });

  it("drops the engine when the media leaves the page on its own", async () => {
    // The player stays: `<video-media>` reports its removal after it has left
    // the page, where the event reaches no ancestor, so the slot is the only
    // thing that can tell the container
    const { player, media } = await mountPlayer();
    await container.initHls();
    expect(container.hls).to.not.equal(undefined);
    player.state.setState(Action.update, { initialized: true, canPlay: true });

    media.remove();
    await microtask();
    await slotChanged();

    expect(container.hls).to.equal(undefined);
    expect(container.videos).to.eql([]);
    expect(player.state.value.initialized).to.equal(false);
    expect(player.state.value.isPlaying).to.not.equal(true);
    // The player cannot have heard it from the media element itself
    expect(player.fullscreen.video).to.equal(null);
  });

  it("abandons a startup whose video is gone before the engine is built", async () => {
    const { media } = await mountPlayer();

    const startup = container.initHls();
    media.remove();
    await startup;
    await slotChanged();

    expect(container.hls).to.equal(undefined);
  });

  it("leaves a copy of the whole player without a video", async () => {
    const { player } = await mountPlayer();

    const copy = player.cloneNode(true) as VideoPlayer;
    await microtask();

    expect(copy.querySelector("video")).to.equal(null);
    expect(copy.querySelector("video-media").shadowRoot).to.equal(null);
  });
});
