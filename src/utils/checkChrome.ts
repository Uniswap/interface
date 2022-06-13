export const checkChrome = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore comment to disable type checking for a line in TypeScript.
  const isChromium = window.chrome
  const winNav = window.navigator
  const vendorName = winNav.vendor
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore comment to disable type checking for a line in TypeScript.
  const isOpera = typeof window.opr !== 'undefined'
  const isIEedge = winNav.userAgent.indexOf('Edg') > -1
  const isIOSChrome = winNav.userAgent.match('CriOS')

  if (isIOSChrome) {
    // is Google Chrome on IOS
    return false
  }
  return !!isChromium && typeof isChromium !== 'undefined' && vendorName === 'Google Inc.' && !isOpera && !isIEedge
}
