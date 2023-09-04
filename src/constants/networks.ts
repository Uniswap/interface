import { ChainId } from '@kinetix/sdk-core'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
}
const QUICKNODE_BNB_RPC_URL = process.env.REACT_APP_BNB_RPC_URL
if (typeof QUICKNODE_BNB_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_BNB_RPC_URL must be a defined environment variable`)
}
const QUICKNODE_BASE_GOERLI_RPC_URL = process.env.REACT_APP_BASE_GOERLI_RPC_URL
if (typeof QUICKNODE_BASE_GOERLI_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_BASE_GOERLI_RPC_URL must be a defined environment variable`)
}
const QUICKNODE_BASE_RPC_URL = process.env.REACT_APP_BASE_MAINNET_RPC_URL
if (typeof QUICKNODE_BASE_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_BASE_MAINNET_RPC_URL must be a defined environment variable`)
}

/**
 * Fallback JSON-RPC endpoints.
 * These are used if the integrator does not provide an endpoint, or if the endpoint does not work.
 *
 * MetaMask allows switching to any URL, but displays a warning if it is not on the "Safe" list:
 * https://github.com/MetaMask/metamask-mobile/blob/bdb7f37c90e4fc923881a07fca38d4e77c73a579/app/core/RPCMethods/wallet_addEthereumChain.js#L228-L235
 * https://chainid.network/chains.json
 *
 * These "Safe" URLs are listed first, followed by other fallback URLs, which are taken from chainlist.org.
 */
export const FALLBACK_URLS = {
  [ChainId.KAVA]: ['https://evm.kava.io', 'https:evm2.kava.io'],
}

/**
 * Known JSON-RPC endpoints.
 * These are the URLs used by the interface when there is not another available source of chain data.
 */
export const RPC_URLS = {
  [ChainId.KAVA]: [`https://evm.kava.io`, ...FALLBACK_URLS[ChainId.KAVA]],
}
