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
  let closeSession: (() => void) | undefined;

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

      closeSession = () => {
        session.removeEventListener("webkitkeymessage", handleKeyMessage);
        session.removeEventListener("webkitkeyerror", handleKeyError);
        closeSession = undefined;
        session.close();
      };
    };

    open().catch(onError);
  };

  videoElement.addEventListener("webkitneedkey", handleNeedKey);

  return () => {
    videoElement.removeEventListener("webkitneedkey", handleNeedKey);
    closeSession?.();
    videoElement.webkitSetMediaKeys(null);
  };
};

/**
 * `[4 byte length][utf-16le skd:// url]` in, and the layout the key server
 * expects out: the untouched init data, then the content id and the certificate
 * each behind their own little-endian length
 */
const buildInitData = (initData: ArrayBuffer, certificate: ArrayBuffer) => {
  const contentId = toUtf16LE(readContentId(initData));
  const parts = [new Uint8Array(initData)];
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

// The leading length prefix decodes to one utf-16 character, dropped with the scheme
const readContentId = (initData: ArrayBuffer) =>
  new TextDecoder("utf-16le").decode(initData).replace("skd://", "").slice(1);

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
