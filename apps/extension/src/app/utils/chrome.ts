/**
 * Helper function to detect if user is using arc chromium browser
 * Will not work until stylesheets are loaded
 * @returns true if user is using arc browser
 */
export function isArcBrowser(): boolean {
  return !!getComputedStyle(document.documentElement).getPropertyValue('--arc-palette-background')
}

/**
 * Helper function to check if chome extension environment supports side panel
 * Arc browser has the functions defined but does not do anything so needs to be explicitly checked
 * @returns true if chrome environment supports side panel
 */
export function checksIfSupportsSidePanel(): boolean {
  return !!chrome.sidePanel && !isArcBrowser()
}
