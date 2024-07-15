import { isAndroid, isIOS } from 'utilities/src/platform'

export const ROUTING_API_PATH = '/v2/quote'

export const REQUEST_SOURCE = isIOS ? 'uniswap-ios' : isAndroid ? 'uniswap-android' : 'uniswap-web'

export { getVersionHeader } from './getVersionHeader'
