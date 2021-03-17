import { unwrapOrThrow } from '../utils'

// the Uniswap Default token list lives here
export const QA_BRIDGE_DEFAULT_TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/fuseio/fuseswap-interface/master/src/constants/qa/tokenlist.json'
export const BETA_BRIDGE_DEFAULT_TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/fuseio/fuseswap-interface/master/src/constants/qa/beta-tokenlist.json'
export const PROD_BRIDGE_DEFAULT_TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/fuseio/fuseswap-default-token-list/master/build/fuseswap-default.tokenlist.json'

export const BRIDGE_LIST_ENV = unwrapOrThrow('BRIDGE_LIST_ENV')

function getBridgeListURL(env: string) {
  switch (env) {
    case 'development':
      return QA_BRIDGE_DEFAULT_TOKEN_LIST_URL
    case 'production':
      return PROD_BRIDGE_DEFAULT_TOKEN_LIST_URL
    case 'beta':
      return BETA_BRIDGE_DEFAULT_TOKEN_LIST_URL
    default:
      return QA_BRIDGE_DEFAULT_TOKEN_LIST_URL
  }
}

export const BRIDGE_DEFAULT_TOKEN_LIST_URL = getBridgeListURL(BRIDGE_LIST_ENV)

export const BRIDGE_DEFAULT_LIST_OF_LISTS: string[] = [BRIDGE_DEFAULT_TOKEN_LIST_URL]

export const SWAP_DEFAULT_TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/fuseio/fuseswap-default-token-list/master/build/fuseswap-default.tokenlist.json'

export const SWAP_DEFAULT_LIST_OF_LISTS: string[] = [SWAP_DEFAULT_TOKEN_LIST_URL]
