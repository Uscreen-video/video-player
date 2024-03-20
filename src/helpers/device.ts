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

const getDevice = () => {
  const ua = navigator?.userAgent;
  if (!ua) return {};

  const isWebkit = !!ua.match(/WebKit/i);
  const isMobileSafari = isIos && isWebkit && !ua.match(/CriOS/i);

  return {
    isIos,
    isWebkit,
    isMobileSafari,
  };
};

export const device = getDevice();
