import { ChainId } from '@jaguarswap/sdk-core'
import { SupportedInterfaceChain } from 'constants/chains'

/**
 * Public JSON-RPC endpoints.
 * These are used if the integrator does not provide an endpoint, or if the endpoint does not work.
 *
 * MetaMask allows switching to any URL, but displays a warning if it is not on the "Safe" list:
 * https://github.com/MetaMask/metamask-mobile/blob/bdb7f37c90e4fc923881a07fca38d4e77c73a579/app/core/RPCMethods/wallet_addEthereumChain.js#L228-L235
 * https://chainid.network/chains.json
 *
 * These "Safe" URLs are listed first, followed by other fallback URLs, which are taken from chainlist.org.
 */
export const PUBLIC_RPC_URLS: Record<SupportedInterfaceChain, string[]> = {
  // [ChainId.X1]: [
  //   // "Safe" URLs
  //   'https://x1testrpc.okx.com',
  //   'https://testrpc.x1.tech',
  // ],
  [ChainId.X1_TESTNET]: [
    // "Safe" URLs
    'https://x1testrpc.okx.com',
    'https://testrpc.x1.tech',
  ],
}

/**
 * Application-specific JSON-RPC endpoints.
 * These are URLs which may only be used by the interface, due to origin policies, &c.
 */
export const APP_RPC_URLS: Record<SupportedInterfaceChain, string[]> = {
  // [ChainId.X1]: [`https://x1rpc.okx.com`],
  [ChainId.X1_TESTNET]: [`https://x1testrpc.okx.com`],
}

export const INFURA_PREFIX_TO_CHAIN_ID: { [prefix: string]: ChainId } = {
  'x1': ChainId.X1_TESTNET,
  'x1-testnet': ChainId.X1_TESTNET,
}
