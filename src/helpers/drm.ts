import { DRMSystemConfiguration } from "../types";

export const initFairPlayDRM = async (element: HTMLElement, fairPlayOptions: DRMSystemConfiguration) => {
  const certificateUrl = fairPlayOptions.certificateUrl;
  const licenseServerUrl = fairPlayOptions.licenseUrl;

  const fairPlayCertificate = await loadFairPlayCertificate(certificateUrl);

  element.addEventListener('encrypted', fairplayEncryptedCallback(fairPlayCertificate, licenseServerUrl));
};

const loadFairPlayCertificate = async (certificateUrl: string) => {
  let response = await fetch(certificateUrl);
  return response.arrayBuffer();
}

const fairplayEncryptedCallback = (fairPlayCertificate: ArrayBuffer, licenseServerUrl: string) => {
  return async (event: MediaEncryptedEvent) => {
    const video = event.target as HTMLVideoElement;
    const initDataType = event.initDataType;

    if (!video.mediaKeys) {
      let access = await navigator.requestMediaKeySystemAccess("com.apple.fps", [{
        initDataTypes: [initDataType],
        videoCapabilities: [{ contentType: 'application/vnd.apple.mpegurl' }],
      }]);

      console.log(access);
      let keys = await access.createMediaKeys();

      await keys.setServerCertificate(fairPlayCertificate);
      await video.setMediaKeys(keys);
    }

    let initData = event.initData;

    let session = video.mediaKeys.createSession();
    session.generateRequest(initDataType, initData);
    let message = await new Promise<MediaKeySessionEventMap["message"]>(resolve => {
      session.addEventListener('message', resolve, { once: true });
    });

    let response = await getLicenseResponse(message, licenseServerUrl);
    await session.update(response);
    return session;
  }
}

const getLicenseResponse = async (event: MediaKeySessionEventMap["message"], licenseServerUrl: string) => {
  let licenseResponse = await fetch(licenseServerUrl, {
    method: 'POST',
    headers: new Headers({'Content-type': 'application/octet-stream'}),
    body: event.message,
  });
  return licenseResponse.arrayBuffer();
}

