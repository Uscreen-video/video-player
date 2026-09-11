const isIos = (() => {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
})();

/**
 * Browsers embedded in another app: Facebook, Instagram, Line, Naver, WeChat,
 * Daum and the Android system WebView. None of them can do DRM playback
 */
const IN_APP_BROWSER_RE =
  /FBAN|FBAV|Instagram|Line\/|NAVER|MicroMessenger|DaumApps|; wv\)/;

const getDevice = () => {
  const ua = navigator?.userAgent;
  if (!ua) return {};

  const isWebkit = !!ua.match(/WebKit/i);
  const isMobileSafari = isIos && isWebkit && !ua.match(/CriOS/i);
  const isInAppBrowser = IN_APP_BROWSER_RE.test(ua);

  return {
    isIos,
    isWebkit,
    isMobileSafari,
    isInAppBrowser,
  };
};

export const device = getDevice();
