import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import { initFairPlayDRM } from "./drm";

const drmOptions = {
  licenseUrl: "https://license.test/license",
  certificateUrl: "https://license.test/certificate",
};

const dispatchEncrypted = (video: HTMLVideoElement) =>
  video.dispatchEvent(
    new MediaEncryptedEvent("encrypted", {
      initDataType: "skd",
      initData: new Uint8Array([1, 2, 3]).buffer,
    }),
  );

const createSession = () => {
  const target = new EventTarget();
  const session = {
    updates: [] as ArrayBuffer[],
    addEventListener: target.addEventListener.bind(target),
    generateRequest: async () => {
      const message = new Event("message");
      target.dispatchEvent(
        Object.assign(message, { message: new Uint8Array([4]).buffer }),
      );
    },
    update: async (response: ArrayBuffer) => {
      session.updates.push(response);
    },
  };
  return session;
};

/**
 * Chromium refuses to attach anything but its own `MediaKeys`, so the key
 * system is faked to be able to walk through the whole FairPlay flow
 */
const fakeKeySystem = (video: HTMLVideoElement) => {
  const sessions: ReturnType<typeof createSession>[] = [];
  const mediaKeys = {
    setServerCertificate: async () => true,
    createSession: () => {
      const session = createSession();
      sessions.push(session);
      return session;
    },
  };

  let attached: unknown = null;
  Object.defineProperty(video, "mediaKeys", { get: () => attached });
  (video as any).setMediaKeys = async (keys: unknown) => {
    attached = keys;
  };
  (navigator as any).requestMediaKeySystemAccess = async () => ({
    createMediaKeys: async () => mediaKeys,
  });

  return sessions;
};

const fakeRefusingKeySystem = (video: HTMLVideoElement) => {
  const mediaKeys = {
    setServerCertificate: async () => true,
    createSession: () => ({
      addEventListener: () => {},
      generateRequest: async () => {
        throw new DOMException("not supported", "NotSupportedError");
      },
      update: async () => {},
    }),
  };

  let attached: unknown = null;
  Object.defineProperty(video, "mediaKeys", { get: () => attached });
  (video as any).setMediaKeys = async (keys: unknown) => {
    attached = keys;
  };
  (navigator as any).requestMediaKeySystemAccess = async () => ({
    createMediaKeys: async () => mediaKeys,
  });
};

describe("initFairPlayDRM", () => {
  const requests: { url: string; method: string }[] = [];
  let requestAccess: typeof navigator.requestMediaKeySystemAccess;
  let request: typeof fetch;
  let status = 200;

  beforeEach(() => {
    requests.length = 0;
    status = 200;
    requestAccess = navigator.requestMediaKeySystemAccess;
    request = window.fetch;
    window.fetch = async (url: any, init: RequestInit = {}) => {
      requests.push({ url: String(url), method: init.method || "GET" });
      return new Response(new ArrayBuffer(8), { status });
    };
  });

  afterEach(() => {
    (navigator as any).requestMediaKeySystemAccess = requestAccess;
    window.fetch = request;
  });

  it("handles an `encrypted` event fired before the setup has finished", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const keySystems: string[] = [];
    const errors: unknown[] = [];

    (navigator as any).requestMediaKeySystemAccess = async (
      keySystem: string,
    ) => {
      keySystems.push(keySystem);
      throw new Error("not available");
    };

    // Not awaited on purpose: the listener has to be attached synchronously
    initFairPlayDRM(video, drmOptions, (error) => errors.push(error));
    dispatchEncrypted(video);

    await waitUntil(() => errors.length === 1);
    expect(keySystems).to.eql(["com.apple.fps", "com.apple.fps.1_0"]);
    expect(requests).to.eql([]);
    // both refusals have to be reported, they tell different stories
    expect(String(errors[0])).to.contain("com.apple.fps: Error: not available");
    expect(String(errors[0])).to.contain(
      "com.apple.fps.1_0: Error: not available",
    );
  });

  it("reports a rejected certificate request", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    status = 403;
    fakeKeySystem(video);

    await initFairPlayDRM(video, drmOptions, (error) => errors.push(error));
    dispatchEncrypted(video);

    await waitUntil(() => errors.length === 1);
    expect(String(errors[0])).to.contain(
      "FairPlay certificate request failed with 403",
    );
  });

  it("routes a refused key request to the WebKit fallback while wireless", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    let refused = 0;

    fakeRefusingKeySystem(video);
    (video as any).webkitCurrentPlaybackTargetIsWireless = true;

    await initFairPlayDRM(
      video,
      drmOptions,
      (error) => errors.push(error),
      () => refused++,
    );
    dispatchEncrypted(video);

    await waitUntil(() => refused === 1);
    expect(errors).to.eql([]);
  });

  it("reports a refused key request while playing locally", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    let refused = 0;

    fakeRefusingKeySystem(video);

    await initFairPlayDRM(
      video,
      drmOptions,
      (error) => errors.push(error),
      () => refused++,
    );
    dispatchEncrypted(video);

    await waitUntil(() => errors.length === 1);
    expect(refused).to.equal(0);
    expect(String(errors[0])).to.contain("NotSupportedError");
  });

  it("removes the `encrypted` listener on teardown", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    const sessions = fakeKeySystem(video);

    const teardown = await initFairPlayDRM(video, drmOptions, (error) =>
      errors.push(error),
    );
    teardown();
    dispatchEncrypted(video);

    await waitUntil(() => true);
    expect(sessions).to.eql([]);
    expect(requests).to.eql([]);
  });

  it("requests a license per `encrypted` event, reusing the certificate", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    const sessions = fakeKeySystem(video);

    await initFairPlayDRM(video, drmOptions, (error) => errors.push(error));
    dispatchEncrypted(video);
    dispatchEncrypted(video);

    await waitUntil(() => sessions.length === 2 && sessions[1].updates.length);
    expect(errors).to.eql([]);
    expect(requests).to.eql([
      { url: drmOptions.certificateUrl, method: "GET" },
      { url: drmOptions.licenseUrl, method: "POST" },
      { url: drmOptions.licenseUrl, method: "POST" },
    ]);
  });
});
