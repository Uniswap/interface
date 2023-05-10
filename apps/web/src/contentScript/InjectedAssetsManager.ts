import { logger } from 'wallet/src/features/logger/logger'

const TAG_ID_PREFIX = 'uniswap-wallet'

// Object of assets to inject, where key is the bundled file name
type InjectedAssets = Record<string, InjectedAssetOptions>

interface InjectedAssetOptions {
  // whether to unmount dom element after load
  unmountOnLoad?: boolean
}

// List of scripts to inject on app startup
const injectedScripts: InjectedAssets = {
  'ethereum.js': {
    // once window.ethereum has been injected, it is safe to remove the script node
    unmountOnLoad: true,
  },
}

// List of pages to inject in iframes on app startup
// iframes are useful when context isolation is necessary (e.g. security)
// ensure html is exported via webpack
// To render <App /> at a specific route
// { `index.html#/${route}`: {} }
const injectedIFrames: InjectedAssets = {}

/**
 * Handles injecting scripts and pages (iframes) onto tab as content script loads
 */
export class InjectedAssetsManager {
  /** Utility method to inject all scripts and all iframes */
  injectAll(): void {
    this.injectScripts()
    this.injectIFrames()
  }

  injectScripts(
    scripts = injectedScripts,
    container = document.head || document.documentElement
  ): void {
    for (const [name, { unmountOnLoad }] of Object.entries(scripts)) {
      logger.debug('InjectedAssetsManager', 'injectScripts', `${name}`)

      const scriptTag = document.createElement('script')
      scriptTag.src = chrome.runtime.getURL(name)
      scriptTag.id = `${TAG_ID_PREFIX}-${name}`

      container.appendChild(scriptTag)

      if (unmountOnLoad) {
        scriptTag.onload = (): void => {
          scriptTag.parentNode?.removeChild(scriptTag)
        }
      }
    }
  }

  injectIFrames(
    iframes = injectedIFrames,
    container = document.body || document.documentElement,
    css = {
      position: 'absolute',
      bottom: '0',
      right: '0',
      display: 'block',
      // TODO: figure out a better way to keep on top
      zIndex: '9999999',
      border: 'none',
    }
  ): void {
    const extensionOrigin = 'chrome-extension://' + chrome.runtime.id
    if (location.ancestorOrigins?.contains(extensionOrigin)) {
      logger.warn(
        'InjectedAssetsManager',
        'injectIFrames',
        'Skipping iFrame injection in extension context'
      )
      return
    }

    for (const [name] of Object.entries(iframes)) {
      logger.debug('InjectedAssetsManager', 'injectIFrames', `${name}`)

      const iframeTag = document.createElement('iframe')
      iframeTag.src = chrome.runtime.getURL(name)
      iframeTag.id = `${TAG_ID_PREFIX}-${name}`
      iframeTag.style.cssText = CSSObjectToString(css)

      container.appendChild(iframeTag)
    }
  }
}

function CSSObjectToString(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}
