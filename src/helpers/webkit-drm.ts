/// <reference types="./webkit-drm.d.ts" />

import { DRMSystemConfiguration } from "../types";

const KEY_SYSTEM = "com.apple.fps.1_0";
const MIME_TYPE = "application/vnd.apple.mpegurl";

/**
 * FairPlay over the WebKit-prefixed API instead of EME. Sender OS 26.1 and 26.2
 * reject `MediaKeySession.generateRequest` with `NotSupportedError` while an
 * AirPlay target is active, and this path is the only one that still acquires a
 * key there
 * @see https://github.com/muxinc/elements/issues/1261
 */
export const initWebkitFairPlayDRM = (
  videoElement: HTMLVideoElement,
  { certificateUrl, licenseUrl }: DRMSystemConfiguration,
  onError: (error: unknown) => void,
) => {
  if (!window.WebKitMediaKeys || !("onwebkitneedkey" in videoElement)) {
    onError(new Error("FairPlay is unavailable, WebKitMediaKeys is missing"));
    return () => {};
  }

  const certificate = fetchBuffer(certificateUrl, "certificate");
  const openSessions = new Set<() => void>();

  const handleNeedKey = (event: WebKitNeedKeyEvent) => {
    const open = async () => {
      if (!videoElement.webkitKeys) {
        videoElement.webkitSetMediaKeys(new WebKitMediaKeys(KEY_SYSTEM));
      }

      if (!event.initData) return;

      const session = videoElement.webkitKeys.createSession(
        MIME_TYPE,
        buildInitData(event.initData, await certificate),
      );

      const handleKeyMessage = async (message: WebKitKeyMessageEvent) => {
        try {
          session.update(
            new Uint8Array(await requestLicense(message.message, licenseUrl)),
          );
        } catch (error) {
          onError(error);
        }
      };

      const handleKeyError = () => {
        const { code, systemCode } = session.error ?? {};
        onError(
          new Error(`FairPlay key session failed (${code}/${systemCode})`),
        );
      };

      session.addEventListener("webkitkeymessage", handleKeyMessage);
      session.addEventListener("webkitkeyerror", handleKeyError);

      const closeSession = () => {
        session.removeEventListener("webkitkeymessage", handleKeyMessage);
        session.removeEventListener("webkitkeyerror", handleKeyError);
        openSessions.delete(closeSession);
        session.close();
      };

      // A stream that rotates keys needs a key session per `webkitneedkey`, and
      // every one of them has to be closed on teardown
      openSessions.add(closeSession);
    };

    open().catch(onError);
  };

  videoElement.addEventListener("webkitneedkey", handleNeedKey);

  return () => {
    videoElement.removeEventListener("webkitneedkey", handleNeedKey);
    // Each call removes itself from the set, so iterate over a snapshot
    for (const closeSession of [...openSessions]) closeSession();
    videoElement.webkitSetMediaKeys(null);
  };
};

/**
 * `[4 byte length][utf-16le skd:// url]` in, and the layout the key server
 * expects out: the untouched init data, then the content id and the certificate
 * each behind their own little-endian length
 */
const buildInitData = (initData: BufferSource, certificate: ArrayBuffer) => {
  const bytes = toBytes(initData);
  const contentId = toUtf16LE(readContentId(bytes));
  const parts = [bytes];
  const sized = [contentId, new Uint8Array(certificate)];

  const size =
    parts[0].byteLength +
    sized.reduce((total, part) => total + part.byteLength + 4, 0);

  const result = new Uint8Array(size);
  const view = new DataView(result.buffer);
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }

  for (const part of sized) {
    view.setUint32(offset, part.byteLength, true);
    offset += 4;
    result.set(part, offset);
    offset += part.byteLength;
  }

  return result;
};

// Safari hands `initData` over as a Uint8Array, whatever the EME-shaped typings
// on the prefixed API say
const toBytes = (source: BufferSource) =>
  source instanceof ArrayBuffer
    ? new Uint8Array(source)
    : new Uint8Array(source.buffer, source.byteOffset, source.byteLength);

// The four byte length prefix covers the url only, so decode that span rather
// than the whole buffer — as two utf-16 code units the prefix is not text
const readContentId = (initData: Uint8Array) => {
  const view = new DataView(
    initData.buffer,
    initData.byteOffset,
    initData.byteLength,
  );
  const length = Math.min(view.getUint32(0, true), initData.byteLength - 4);
  const url = new TextDecoder("utf-16le").decode(
    initData.subarray(4, 4 + length),
  );
  return url.replace(/^skd:\/\//, "");
};

const toUtf16LE = (value: string) => {
  const result = new Uint8Array(value.length * 2);
  const view = new DataView(result.buffer);

  for (let i = 0; i < value.length; i++) {
    view.setUint16(i * 2, value.charCodeAt(i), true);
  }

  return result;
};

const requestLicense = (message: ArrayBuffer, licenseUrl: string) =>
  fetchBuffer(licenseUrl, "license", {
    method: "POST",
    headers: new Headers({ "Content-type": "application/octet-stream" }),
    body: message,
  });

const fetchBuffer = async (url: string, name: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`FairPlay ${name} request failed with ${response.status}`);
  }
  return response.arrayBuffer();
};
