import { logger } from 'wallet/src/features/logger/logger'

const TAG_ID_PREFIX = 'uniswap-wallet'

// SCRIPTS

interface InjectedScriptOptions {
  // whether to load on app startup
  lazy?: boolean
  // whether to unmount dom element after load
  unmountOnLoad?: boolean
}

// List of scripts to inject on app startup
const INJECTED_SCRIPTS = {
  'ethereum.js': {
    // load on app startup
    lazy: false,
    // once window.ethereum has been injected, it is safe to remove the script node
    unmountOnLoad: true,
  },
  // add more scripts here as needed
} as const

function injectScript<T extends string = keyof typeof INJECTED_SCRIPTS>(
  filename: T,
  options: InjectedScriptOptions,
  container = document.head || document.documentElement
): void {
  logger.debug('InjectedAssetsManager', 'injectScript', `${filename}`)

  const scriptTag = document.createElement('script')
  scriptTag.src = chrome.runtime.getURL(filename)
  scriptTag.id = `${TAG_ID_PREFIX}-${filename}`

  if (document.getElementById(scriptTag.id)) {
    logger.debug('InjectedAssetsManager', 'injectScript', 'Script tag already in DOM')
    return
  }

  container.appendChild(scriptTag)

  if (options.unmountOnLoad) {
    scriptTag.onload = (): void => {
      scriptTag.parentNode?.removeChild(scriptTag)
    }
  }
}

// FRAMES

// iframes are useful when context isolation is necessary (e.g. security)
// NOTE: ensure html is exported via webpack
//
// @example To render <App /> at a specific route
//   { `index.html#/${route}`: { lazy: true } }
const INJECTED_FRAMES = {
  'index.html': {
    lazy: true,
  },
} as const

function injectFrame<T extends string = keyof typeof INJECTED_FRAMES>(
  filename: T,
  container = document.body || document.documentElement,
  css = 'position:absolute; bottom:0;right:50px;display:block;z-index:99999999;border:none;width:350px;height:600px;'
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

  logger.debug('InjectedAssetsManager', 'injectFrame', `${filename}`)

  const iframeTag = document.createElement('iframe')
  iframeTag.src = chrome.runtime.getURL(filename)
  iframeTag.id = `${TAG_ID_PREFIX}-${filename}`
  iframeTag.style.cssText = css

  if (document.getElementById(iframeTag.id)) {
    logger.debug('InjectedAssetsManager', 'injectFrame', 'Frame already in DOM')
    return
  }

  container.appendChild(iframeTag)
}

function removeFrame<T extends string = keyof typeof INJECTED_FRAMES>(filename: T): void {
  const iframeTagId = `${TAG_ID_PREFIX}-${filename}`

  const tag = document.getElementById(iframeTagId)

  if (!tag) {
    logger.debug('InjectedAssetsManager', 'injectFrame', 'Frame not found in DOM')
    return
  }

  tag.remove()
}
function init(scripts = INJECTED_SCRIPTS, frames = INJECTED_FRAMES): void {
  for (const name of Object.keys(scripts) as Array<keyof typeof scripts>) {
    if (!scripts[name].lazy) {
      injectScript(name, scripts[name])
    }
  }

  for (const name of Object.keys(frames) as Array<keyof typeof frames>) {
    if (!frames[name].lazy) {
      injectFrame(name)
    }
  }
}

/**
 * Handles injecting scripts and pages (iframes) onto tab as content script loads
 */
export const InjectedAssetsManager = {
  init,
  injectScript,
  injectFrame,
  removeFrame,
}
