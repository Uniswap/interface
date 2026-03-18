/**
 * Helper function to detect if user is using arc chromium browser
 * Will not work until some time after (eg 1s) stylesheets are loaded
 * @returns true if user is using arc browser
 */
export function isArcBrowser(): boolean {
  return !!getComputedStyle(document.documentElement).getPropertyValue('--arc-palette-background')
}

/**
 * Helper function to detect if user is using an android device
 * @returns true if user is using an android device
 */
export function isAndroid(): boolean {
  return navigator.userAgent.toLowerCase().indexOf('android') > -1
}

/**
 * Helper function to check if chrome extension environment supports side panel
 * Some environments have the functions defined but do not do anything so needs to be explicitly checked
 * @returns true if chrome environment supports side panel
 */
export function checksIfSupportsSidePanel(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return !!chrome.sidePanel && !isArcBrowser() && !isAndroid()
}
