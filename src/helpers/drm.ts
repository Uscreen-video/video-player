import { DRMSystemConfiguration } from "../types";

export const initFairPlayDRM = async (
  element: HTMLElement,
  fairPlayOptions: DRMSystemConfiguration,
) => {
  const certificateUrl = fairPlayOptions.certificateUrl;
  const licenseServerUrl = fairPlayOptions.licenseUrl;

  const fairPlayCertificate = await loadFairPlayCertificate(certificateUrl);

  element.addEventListener(
    "encrypted",
    fairplayEncryptedCallback(fairPlayCertificate, licenseServerUrl),
  );
};

const loadFairPlayCertificate = async (certificateUrl: string) => {
  let response = await fetch(certificateUrl);
  return response.arrayBuffer();
};

const fairplayEncryptedCallback = (
  fairPlayCertificate: BufferSource,
  licenseServerUrl: string,
) => {
  return async (event: any) => {
    console.log("fairplayEncrypted callback", event);

    const video = event.target;
    const initDataType = event.initDataType;

    if (!video.mediaKeys) {
      let access = await navigator.requestMediaKeySystemAccess(
        "com.apple.fps",
        [
          {
            initDataTypes: [initDataType],
            videoCapabilities: [
              { contentType: "application/vnd.apple.mpegurl" },
            ],
          },
        ],
      );

      console.log(access);
      let keys = await access.createMediaKeys();

      await keys.setServerCertificate(fairPlayCertificate);
      await video.setMediaKeys(keys);
    }

    let initData = event.initData;

    let session = video.mediaKeys.createSession();
    session.generateRequest(initDataType, initData);
    let message = await new Promise((resolve) => {
      session.addEventListener("message", resolve, { once: true });
    });

    let response = await getLicenseResponse(message, licenseServerUrl);
    await session.update(response);
    return session;
  };
};

const getLicenseResponse = async (event: any, licenseServerUrl: string) => {
  // let spc_string = btoa(String.fromCharCode(...new Uint8Array(event.message)));
  let licenseResponse = await fetch(licenseServerUrl, {
    method: "POST",
    headers: new Headers({
      "Content-type": "application/json",
      "X-AxDRM-Message":
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiNjllNTQwODgtZTllMC00NTMwLThjMWEtMWViNmRjZDBkMTRlIiwibWVzc2FnZSI6eyJ2ZXJzaW9uIjoyLCJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImxpY2Vuc2UiOnsiYWxsb3dfcGVyc2lzdGVuY2UiOnRydWV9LCJjb250ZW50X2tleXNfc291cmNlIjp7ImlubGluZSI6W3siaWQiOiIyMTFhYzFkYy1jOGEyLTQ1NzUtYmFmNy1mYTRiYTU2YzM4YWMiLCJ1c2FnZV9wb2xpY3kiOiJUaGVPbmVQb2xpY3kifV19LCJjb250ZW50X2tleV91c2FnZV9wb2xpY2llcyI6W3sibmFtZSI6IlRoZU9uZVBvbGljeSIsInBsYXlyZWFkeSI6eyJwbGF5X2VuYWJsZXJzIjpbIjc4NjYyN0Q4LUMyQTYtNDRCRS04Rjg4LTA4QUUyNTVCMDFBNyJdfX1dfX0.D9FM9sbTFxBmcCOC8yMHrEtTwm0zy6ejZUCrlJbHz_U",
    }),
    body: event.message,
    // body: JSON.stringify({
    //   "spc" : spc_string
    // }),
  });
  return licenseResponse.arrayBuffer();
};
