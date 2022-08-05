export const checkChrome = (): boolean => {
  const isChromium = window.chrome
  const winNav = window.navigator
  const vendorName = winNav.vendor

  const isOpera = typeof window.opr !== 'undefined'
  const isIEedge = winNav.userAgent.indexOf('Edg') > -1
  const isIOSChrome = winNav.userAgent.match('CriOS')

  if (isIOSChrome) {
    // is Google Chrome on IOS
    return false
  }
  return !!isChromium && typeof isChromium !== 'undefined' && vendorName === 'Google Inc.' && !isOpera && !isIEedge
}
