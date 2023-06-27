const getDevice = () => {
  const ua = navigator?.userAgent
  if (!ua) return {}

  const isIos = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i)
  const isWebkit = !!ua.match(/WebKit/i)
  const isMobileSafari = isIos && isWebkit && !ua.match(/CriOS/i)

  return {
    isIos, isWebkit, isMobileSafari
  }
}

export const device = getDevice()
