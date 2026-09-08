import type { ErrorData } from "hls.js";
import {
  DRMFailureReason,
  DRMSystemConfiguration,
  KeySystems,
  PlayerError,
} from "../types";

/**
 * Modern EME expects the unversioned key system, the FairPlay 1.0 identifier is
 * kept as a fallback for WebKit builds that do not accept it
 * @see https://bugs.webkit.org/show_bug.cgi?id=197433
 */
const KEY_SYSTEMS: string[] = [KeySystems.fps, "com.apple.fps.1_0"];

export class DRMError extends Error {
  constructor(
    message: string,
    public readonly reason: DRMFailureReason,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "DRMError";
  }
}

/** What the last license request looked like, for the error report */
export type LicenseExchange = {
  keySystem?: string;
  status?: number;
  cdmVersion?: string;
};

const KEY_SYSTEM_REASONS: Record<string, DRMFailureReason> = {
  keySystemNoAccess: "no-access",
  keySystemLicenseRequestFailed: "license-refused",
};

export const keySystemErrorToPlayerError = (
  error: Pick<ErrorData, "details"> & { response?: { code?: number } },
  exchange: LicenseExchange = {},
): PlayerError => ({
  drm: true,
  reason: KEY_SYSTEM_REASONS[error.details] ?? "unknown",
  details: error.details,
  status: error.response?.code ?? exchange.status,
  keySystem: exchange.keySystem,
  cdmVersion: exchange.cdmVersion,
});

export const drmErrorToPlayerError = (error: unknown): PlayerError =>
  error instanceof DRMError
    ? {
        drm: true,
        reason: error.reason,
        status: error.status,
        message: error.message,
        keySystem: KeySystems.fps,
      }
    : { drm: true, reason: "unknown", message: String(error) };

const CDM_VERSION = /\d+\.\d+\.\d+\.\d+/;
const CHALLENGE_SCAN_BYTES = 4096;

/**
 * The Widevine CDM writes its build number in plain ASCII inside the license
 * challenge. A heuristic: it returns nothing rather than guessing
 */
export const widevineCdmVersion = (
  challenge: Uint8Array,
): string | undefined => {
  const text = new TextDecoder("latin1").decode(
    challenge.subarray(0, CHALLENGE_SCAN_BYTES),
  );
  return text.match(CDM_VERSION)?.[0];
};

// Shares one request between concurrent `encrypted` events: the first call wins
// and every later one gets its promise, whatever arguments they pass. A failure
// is forgotten so that the next event can retry
const once = <A extends unknown[], T>(request: (...args: A) => Promise<T>) => {
  let pending: Promise<T>;
  return (...args: A) => {
    if (!pending) {
      pending = request(...args).catch((error) => {
        pending = undefined;
        throw error;
      });
    }
    return pending;
  };
};

export const initFairPlayDRM = async (
  videoElement: HTMLVideoElement,
  { certificateUrl, licenseUrl }: DRMSystemConfiguration,
  onError: (error: unknown) => void,
  onWirelessKeyRequestRefused?: () => void,
) => {
  const loadCertificate = once(() =>
    fetchBuffer(certificateUrl, "certificate", "certificate-failed"),
  );

  const attachMediaKeys = once(async (initDataType: string) => {
    if (videoElement.mediaKeys) return;

    const access = await requestKeySystemAccess(initDataType);
    const keys = await access.createMediaKeys();

    await keys.setServerCertificate(await loadCertificate());
    await videoElement.setMediaKeys(keys);
  });

  const handleEncrypted = async (event: MediaEncryptedEvent) => {
    try {
      await attachMediaKeys(event.initDataType);
      await createKeySession(event, licenseUrl);
    } catch (error) {
      if (isWirelessKeyRequestRefusal(error, videoElement)) {
        onWirelessKeyRequestRefused?.();
        return;
      }
      onError(error);
    }
  };

  // Safari serves the source from the markup, so `encrypted` can fire before
  // this module is evaluated. The listener has to be attached before any await,
  // otherwise the event is missed and no key session is ever created
  videoElement.addEventListener("encrypted", handleEncrypted);

  return () => {
    videoElement.removeEventListener("encrypted", handleEncrypted);
  };
};

/**
 * Sender OS 26.1 and 26.2 reject `generateRequest` with `NotSupportedError`
 * once playback moves to an AirPlay target, and no EME retry recovers it
 * @see https://github.com/muxinc/elements/issues/1261
 */
const isWirelessKeyRequestRefusal = (
  error: unknown,
  videoElement: HTMLVideoElement,
) =>
  error instanceof DOMException &&
  error.name === "NotSupportedError" &&
  Boolean(videoElement.webkitCurrentPlaybackTargetIsWireless);

const requestKeySystemAccess = async (initDataType: string) => {
  const failures: string[] = [];

  for (const keySystem of KEY_SYSTEMS) {
    try {
      return await navigator.requestMediaKeySystemAccess(keySystem, [
        {
          initDataTypes: [initDataType],
          videoCapabilities: [{ contentType: "application/vnd.apple.mpegurl" }],
        },
      ]);
    } catch (e) {
      failures.push(`${keySystem}: ${e}`);
    }
  }

  throw new DRMError(
    `No FairPlay key system available (${failures.join(", ")})`,
    "no-access",
  );
};

const createKeySession = async (
  event: MediaEncryptedEvent,
  licenseUrl: string,
) => {
  const video = event.target as HTMLVideoElement;
  const session = video.mediaKeys.createSession();

  const message = new Promise<MediaKeySessionEventMap["message"]>((resolve) => {
    session.addEventListener("message", resolve, { once: true });
  });

  await session.generateRequest(event.initDataType, event.initData);
  await session.update(await requestLicense(await message, licenseUrl));

  return session;
};

const requestLicense = async (
  event: MediaKeySessionEventMap["message"],
  licenseUrl: string,
) =>
  fetchBuffer(licenseUrl, "license", "license-refused", {
    method: "POST",
    headers: new Headers({ "Content-type": "application/octet-stream" }),
    body: event.message,
  });

const fetchBuffer = async (
  url: string,
  name: string,
  reason: DRMFailureReason,
  init?: RequestInit,
) => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new DRMError(
      `FairPlay ${name} request failed with ${response.status}`,
      reason,
      response.status,
    );
  }
  return response.arrayBuffer();
};
