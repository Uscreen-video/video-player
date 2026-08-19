import { DRMSystemConfiguration, KeySystems } from "../types";

/**
 * Modern EME expects the unversioned key system, the FairPlay 1.0 identifier is
 * kept as a fallback for WebKit builds that do not accept it
 * @see https://bugs.webkit.org/show_bug.cgi?id=197433
 */
const KEY_SYSTEMS: string[] = [KeySystems.fps, "com.apple.fps.1_0"];

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
) => {
  const loadCertificate = once(() =>
    fetchBuffer(certificateUrl, "certificate"),
  );

  const attachMediaKeys = once(async (initDataType: string) => {
    if (videoElement.mediaKeys) return;

    const access = await requestKeySystemAccess(initDataType);
    const keys = await access.createMediaKeys();

    await keys.setServerCertificate(await loadCertificate());
    await videoElement.setMediaKeys(keys);
  });

  // Safari serves the source from the markup, so `encrypted` can fire before
  // this module is evaluated. The listener has to be attached before any await,
  // otherwise the event is missed and no key session is ever created
  videoElement.addEventListener("encrypted", async (event) => {
    try {
      await attachMediaKeys(event.initDataType);
      await createKeySession(event, licenseUrl);
    } catch (error) {
      onError(error);
    }
  });
};

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

  throw new Error(`No FairPlay key system available (${failures.join(", ")})`);
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
  fetchBuffer(licenseUrl, "license", {
    method: "POST",
    headers: new Headers({ "Content-type": "application/octet-stream" }),
    body: event.message,
  });

const fetchBuffer = async (url: string, name: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`FairPlay ${name} request failed with ${response.status}`);
  }
  return response.arrayBuffer();
};
