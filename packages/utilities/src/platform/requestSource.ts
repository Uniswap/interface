import { isAndroid, isExtensionApp, isIOS } from 'utilities/src/platform'

/**
 * Returns the x-request-source header value for the current platform.
 * This header should be added to all requests to Uniswap services.
 */
function getRequestSource(): string {
  if (isIOS) {
    return 'uniswap-ios'
  }
  if (isAndroid) {
    return 'uniswap-android'
  }
  if (isExtensionApp) {
    return 'uniswap-extension'
  }
  return 'uniswap-web'
}

export const REQUEST_SOURCE = getRequestSource()
