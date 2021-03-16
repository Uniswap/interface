import { unwrapOrThrow } from '../utils'

// the Uniswap Default token list lives here
const QA_BRIDGE_DEFAULT_TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/fuseio/fuseswap-interface/master/src/constants/qa/tokenlist.json'
const PROD_BRIDGE_DEFAULT_TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/fuseio/fuseswap-default-token-list/master/build/fuseswap-default.tokenlist.json'

export const USE_PROD_BRIDGE_LIST = unwrapOrThrow('USE_PROD_BRIDGE_LIST') === 'true' ? true : false

export const BRIDGE_DEFAULT_TOKEN_LIST_URL = USE_PROD_BRIDGE_LIST
  ? PROD_BRIDGE_DEFAULT_TOKEN_LIST_URL
  : QA_BRIDGE_DEFAULT_TOKEN_LIST_URL

export const BRIDGE_DEFAULT_LIST_OF_LISTS: string[] = [BRIDGE_DEFAULT_TOKEN_LIST_URL]

export const SWAP_DEFAULT_TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/fuseio/fuseswap-default-token-list/master/build/fuseswap-default.tokenlist.json'

export const SWAP_DEFAULT_LIST_OF_LISTS: string[] = [SWAP_DEFAULT_TOKEN_LIST_URL]
