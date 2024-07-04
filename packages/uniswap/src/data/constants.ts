import { isAndroid, isExtension, isIOS } from 'utilities/src/platform'

export const ROUTING_API_PATH = '/v2/quote'

export const REQUEST_SOURCE = getRequestSource()

function getRequestSource(): string {
  if (isIOS) {
    return 'uniswap-ios'
  }
  if (isAndroid) {
    return 'uniswap-android'
  }
  if (isExtension) {
    return 'uniswap-extension'
  }
  return 'uniswap-web'
}

export { getVersionHeader } from './getVersionHeader'
