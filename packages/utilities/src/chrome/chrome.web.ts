// Disabling this because we need access to `chrome` in the global scope.
/* biome-ignore-all lint/style/noRestrictedGlobals: we need access to `chrome` in the global scope */

import { isExtensionApp } from 'utilities/src/platform'

/**
 * Returns the Chrome API if available in the current context, or undefined otherwise.
 * We use this helper because otherwise `chrome` is always defined in TypeScript,
 * and we want to be able to have access to these types while preventing accidental use when not available.
 */
export function getChrome(): typeof chrome | undefined {
  if (typeof chrome !== 'undefined') {
    return chrome
  }

  warnIfChromeIsAccessedInContentScript()

  return undefined
}

/**
 * Returns the Chrome API if available in the current context, or throws an error otherwise.
 * Use this when the code is running in the Extension context.
 */
export function getChromeWithThrow(): typeof chrome {
  if (typeof chrome !== 'undefined') {
    return chrome
  }

  warnIfChromeIsAccessedInContentScript()

  throw new Error('`chrome` is not available in this context')
}

/**
 * Returns the Chrome runtime API if available in the current context, or undefined otherwise.
 * We use this helper because otherwise `chrome` is always defined in TypeScript,
 * and we want to be able to have access to these types while preventing accidental use when not available.
 */
export function getChromeRuntime(): typeof chrome.runtime | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime
  }

  warnIfChromeIsAccessedInContentScript()

  return undefined
}

/**
 * Returns the Chrome runtime API if available in the current context, or throws an error otherwise.
 * Use this when the code is running in the Extension context.
 */
export function getChromeRuntimeWithThrow(): typeof chrome.runtime {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime
  }

  warnIfChromeIsAccessedInContentScript()

  throw new Error('`chrome.runtime` is not available in this context')
}

function warnIfChromeIsAccessedInContentScript(): void {
  if (isExtensionApp) {
    // biome-ignore lint/suspicious/noConsole: Console logging needed for debugging
    console.warn(
      'You are trying to access `chrome.runtime` inside the injected content script ' +
        'even though it does not exist in this context. ' +
        '`chrome.runtime` is only available in the injected script when it is running inside a trusted site (`app.uniswap.org`), ' +
        'so this could have unintended consequences and should be avoided.',
    )
  }
}
