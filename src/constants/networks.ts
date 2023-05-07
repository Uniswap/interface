import { SupportedChainId } from 'constants/chains'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
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
export const FALLBACK_URLS: { [key in SupportedChainId]: string[] } = {
  [SupportedChainId.MAINNET]: [
    // "Safe" URLs
    'https://jsonrpc-evmos-ia.cosmosia.notional.ventures',
  ],
  [SupportedChainId.OPTIMISM]: [
    // "Safe" URLs
    'https://ava-testnet.public.blastapi.io/ext/bc/C/rpc	',
  ],
}

/**
 * Known JSON-RPC endpoints.
 * These are the URLs used by the interface when there is not another available source of chain data.
 */
export const RPC_URLS: { [key in SupportedChainId]: string[] } = {
  [SupportedChainId.MAINNET]: [`https://eth.bd.evmos.org:8545`, ...FALLBACK_URLS[SupportedChainId.MAINNET]],

  [SupportedChainId.OPTIMISM]: [
    // `https://api.avax-test.network/ext/bc/C/rpc`,
    'https://mainnet.optimism.io',
    ...FALLBACK_URLS[SupportedChainId.MAINNET],
  ],
}

export const RPC_URLS_FOR_BRIDGE: { [key in number]: string } = {
  1: 'https://rpc.ankr.com/eth',
  137: 'https://polygon-rpc.com/',
  56: 'https://bsc-dataseed1.binance.org',
  42161: 'https://rpc.ankr.com/arbitrum',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
  250: 'https://fantom-mainnet.gateway.pokt.network/v1/lb/62759259ea1b320039c9e7ac',
}
