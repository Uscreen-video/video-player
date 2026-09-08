import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import {
  DRMError,
  initFairPlayDRM,
  keySystemErrorToPlayerError,
  widevineCdmVersion,
} from "./drm";

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
  let licenseStatus: number | undefined;

  beforeEach(() => {
    requests.length = 0;
    status = 200;
    licenseStatus = undefined;
    requestAccess = navigator.requestMediaKeySystemAccess;
    request = window.fetch;
    window.fetch = async (url: any, init: RequestInit = {}) => {
      requests.push({ url: String(url), method: init.method || "GET" });
      const isLicense = String(url) === drmOptions.licenseUrl;
      return new Response(new ArrayBuffer(8), {
        status: isLicense && licenseStatus ? licenseStatus : status,
      });
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
    expect(errors[0]).to.be.instanceOf(DRMError);
    expect((errors[0] as DRMError).reason).to.equal("no-access");
    expect((errors[0] as DRMError).status).to.equal(undefined);
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
    expect((errors[0] as DRMError).reason).to.equal("certificate-failed");
    expect((errors[0] as DRMError).status).to.equal(403);
  });

  it("reports a refused license with its status", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    licenseStatus = 500;
    fakeKeySystem(video);

    await initFairPlayDRM(video, drmOptions, (error) => errors.push(error));
    dispatchEncrypted(video);

    await waitUntil(() => errors.length === 1);
    expect(String(errors[0])).to.contain(
      "FairPlay license request failed with 500",
    );
    expect((errors[0] as DRMError).reason).to.equal("license-refused");
    expect((errors[0] as DRMError).status).to.equal(500);
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

describe("keySystemErrorToPlayerError", () => {
  it("maps a missing key system to `no-access`", () => {
    const error = keySystemErrorToPlayerError({
      details: "keySystemNoAccess",
    } as any);

    expect(error).to.eql({
      drm: true,
      reason: "no-access",
      details: "keySystemNoAccess",
      status: undefined,
      keySystem: undefined,
      cdmVersion: undefined,
    });
  });

  it("maps a refused license to `license-refused` with the response status", () => {
    const error = keySystemErrorToPlayerError(
      {
        details: "keySystemLicenseRequestFailed",
        response: { code: 500 },
      } as any,
      { keySystem: "com.widevine.alpha", cdmVersion: "4.10.2934.0" },
    );

    expect(error).to.eql({
      drm: true,
      reason: "license-refused",
      details: "keySystemLicenseRequestFailed",
      status: 500,
      keySystem: "com.widevine.alpha",
      cdmVersion: "4.10.2934.0",
    });
  });

  it("falls back to the recorded exchange status when hls.js has none", () => {
    const error = keySystemErrorToPlayerError(
      { details: "keySystemLicenseRequestFailed" } as any,
      { status: 403 },
    );

    expect(error.status).to.equal(403);
  });

  it("maps any other key-system failure to `unknown`, keeping the detail", () => {
    const error = keySystemErrorToPlayerError({
      details: "keySystemSessionUpdateFailed",
    } as any);

    expect(error.reason).to.equal("unknown");
    expect(error.details).to.equal("keySystemSessionUpdateFailed");
    expect(error.code).to.equal(undefined);
  });
});

describe("widevineCdmVersion", () => {
  const bytes = (text: string) => new TextEncoder().encode(text);

  it("reads the CDM build out of the challenge", () => {
    const challenge = new Uint8Array([
      ...[8, 1, 18, 200, 3, 0, 255],
      ...bytes("widevine_cdm\0architecture_name\0x86-64\0"),
      ...bytes("4.10.2934.0"),
      ...[0, 0, 0],
    ]);

    expect(widevineCdmVersion(challenge)).to.equal("4.10.2934.0");
  });

  it("returns nothing when the challenge carries no version", () => {
    expect(widevineCdmVersion(new Uint8Array([1, 2, 3, 4]))).to.equal(
      undefined,
    );
    expect(widevineCdmVersion(bytes("version 4.10 only"))).to.equal(undefined);
  });
});
