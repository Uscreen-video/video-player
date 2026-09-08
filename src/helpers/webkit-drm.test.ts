import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import { initWebkitFairPlayDRM } from "./webkit-drm";

const drmOptions = {
  licenseUrl: "https://license.test/license",
  certificateUrl: "https://license.test/certificate",
};

const skdInitData = () => {
  const url = "skd://content-id";
  const data = new Uint8Array(4 + url.length * 2);
  const view = new DataView(data.buffer);

  view.setUint32(0, url.length * 2, true);
  for (let i = 0; i < url.length; i++) {
    view.setUint16(4 + i * 2, url.charCodeAt(i), true);
  }

  return data.buffer;
};

const dispatchNeedKey = (
  video: HTMLVideoElement,
  initData: BufferSource = skdInitData(),
) =>
  video.dispatchEvent(Object.assign(new Event("webkitneedkey"), { initData }));

/**
 * The tail of the payload is `[4 byte length][part]` repeated — the content id
 * first, then the certificate
 */
const readSizedParts = (payload: Uint8Array, offset: number) => {
  const view = new DataView(
    payload.buffer,
    payload.byteOffset,
    payload.byteLength,
  );
  const parts: Uint8Array[] = [];

  while (offset < payload.byteLength) {
    const length = view.getUint32(offset, true);
    offset += 4;
    parts.push(payload.subarray(offset, offset + length));
    offset += length;
  }

  return parts;
};

const fakeKeySystem = (video: HTMLVideoElement) => {
  const sessions: {
    initData: Uint8Array;
    updates: Uint8Array[];
    closed: boolean;
    fail: () => void;
    message: () => void;
  }[] = [];

  const createSession = (_mimeType: string, initData: Uint8Array) => {
    const target = new EventTarget();
    const session = {
      initData,
      updates: [] as Uint8Array[],
      closed: false,
      error: { code: 3, systemCode: 42 },
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      update: (key: Uint8Array) => session.updates.push(key),
      close: () => {
        session.closed = true;
      },
      message: () =>
        target.dispatchEvent(
          Object.assign(new Event("webkitkeymessage"), {
            message: new Uint8Array([4]).buffer,
          }),
        ),
      fail: () => target.dispatchEvent(new Event("webkitkeyerror")),
    };
    sessions.push(session);
    return session;
  };

  (window as any).WebKitMediaKeys = class {
    createSession = createSession;
  };
  (video as any).onwebkitneedkey = null;
  (video as any).webkitSetMediaKeys = (keys: unknown) => {
    (video as any).webkitKeys = keys;
  };

  return sessions;
};

describe("initWebkitFairPlayDRM", () => {
  const requests: { url: string; method: string }[] = [];
  let mediaKeys: unknown;
  let request: typeof fetch;
  let status = 200;

  beforeEach(() => {
    requests.length = 0;
    status = 200;
    mediaKeys = (window as any).WebKitMediaKeys;
    request = window.fetch;
    window.fetch = async (url: any, init: RequestInit = {}) => {
      requests.push({ url: String(url), method: init.method || "GET" });
      return new Response(new ArrayBuffer(8), { status });
    };
  });

  afterEach(() => {
    (window as any).WebKitMediaKeys = mediaKeys;
    window.fetch = request;
  });

  it("reports an error when the legacy key system is unavailable", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    delete (window as any).WebKitMediaKeys;

    const teardown = initWebkitFairPlayDRM(video, drmOptions, (error) =>
      errors.push(error),
    );

    expect(String(errors[0])).to.contain("WebKitMediaKeys is missing");
    expect(requests).to.eql([]);
    expect(teardown).to.be.a("function");
  });

  it("exchanges a key message for a license and updates the session", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    const sessions = fakeKeySystem(video);

    initWebkitFairPlayDRM(video, drmOptions, (error) => errors.push(error));
    dispatchNeedKey(video);

    await waitUntil(() => sessions.length === 1);
    sessions[0].message();

    await waitUntil(() => sessions[0].updates.length === 1);
    expect(errors).to.eql([]);
    expect(requests).to.eql([
      { url: drmOptions.certificateUrl, method: "GET" },
      { url: drmOptions.licenseUrl, method: "POST" },
    ]);
  });

  it("reports a rejected license request", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    const sessions = fakeKeySystem(video);

    initWebkitFairPlayDRM(video, drmOptions, (error) => errors.push(error));
    dispatchNeedKey(video);

    await waitUntil(() => sessions.length === 1);
    status = 403;
    sessions[0].message();

    await waitUntil(() => errors.length === 1);
    expect(String(errors[0])).to.contain(
      "FairPlay license request failed with 403",
    );
    expect(sessions[0].updates).to.eql([]);
  });

  it("hands the session a content id without the length prefix", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    const sessions = fakeKeySystem(video);
    const initData = skdInitData();

    initWebkitFairPlayDRM(video, drmOptions, (error) => errors.push(error));
    dispatchNeedKey(video, initData);

    await waitUntil(() => sessions.length === 1);

    const [contentId, certificate] = readSizedParts(
      sessions[0].initData,
      initData.byteLength,
    );

    expect(new TextDecoder("utf-16le").decode(contentId)).to.equal(
      "content-id",
    );
    expect(certificate.byteLength).to.equal(8);
    expect(errors).to.eql([]);
  });

  it("accepts the Uint8Array init data Safari actually dispatches", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    const sessions = fakeKeySystem(video);
    const initData = new Uint8Array(skdInitData());

    initWebkitFairPlayDRM(video, drmOptions, (error) => errors.push(error));
    dispatchNeedKey(video, initData);

    await waitUntil(() => sessions.length === 1);

    const [contentId] = readSizedParts(
      sessions[0].initData,
      initData.byteLength,
    );

    expect(new TextDecoder("utf-16le").decode(contentId)).to.equal(
      "content-id",
    );
    expect(errors).to.eql([]);
  });

  it("closes every session it opened on teardown", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    const sessions = fakeKeySystem(video);

    const teardown = initWebkitFairPlayDRM(video, drmOptions, (error) =>
      errors.push(error),
    );

    dispatchNeedKey(video);
    await waitUntil(() => sessions.length === 1);
    dispatchNeedKey(video);
    await waitUntil(() => sessions.length === 2);

    teardown();

    expect(sessions.map(({ closed }) => closed)).to.eql([true, true]);
  });

  it("closes the session and stops listening on teardown", async () => {
    const video = await fixture<HTMLVideoElement>(html`<video></video>`);
    const errors: unknown[] = [];
    const sessions = fakeKeySystem(video);

    const teardown = initWebkitFairPlayDRM(video, drmOptions, (error) =>
      errors.push(error),
    );
    dispatchNeedKey(video);

    await waitUntil(() => sessions.length === 1);
    teardown();

    expect(sessions[0].closed).to.be.true;
    expect((video as any).webkitKeys).to.be.null;

    dispatchNeedKey(video);
    await waitUntil(() => true);
    expect(sessions.length).to.equal(1);
  });
});
