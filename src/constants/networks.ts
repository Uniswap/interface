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
    'https://api.mycryptoapi.com/eth',
    'https://cloudflare-eth.com',
    // "Fallback" URLs
    'https://rpc.ankr.com/eth',
    'https://eth-mainnet.public.blastapi.io',
  ],
  [SupportedChainId.FUJI]: [
    // "Safe" URLs
    'https://ava-testnet.public.blastapi.io/ext/bc/C/rpc	',
  ],
  [SupportedChainId.OPTIMISM]: [
    // "Safe" URLs
    'https://ava-testnet.public.blastapi.io/ext/bc/C/rpc	',
  ],
  [SupportedChainId.TESTNET]: ['https://eth.bd.evmos.dev:8545'],
}

/**
 * Known JSON-RPC endpoints.
 * These are the URLs used by the interface when there is not another available source of chain data.
 */
export const RPC_URLS: { [key in SupportedChainId]: string[] } = {
  [SupportedChainId.MAINNET]: [
    `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    ...FALLBACK_URLS[SupportedChainId.MAINNET],
  ],
  [SupportedChainId.TESTNET]: ['https://eth.bd.evmos.dev:8545', ...FALLBACK_URLS[SupportedChainId.FUJI]],
  [SupportedChainId.FUJI]: [`https://api.avax-test.network/ext/bc/C/rpc`, ...FALLBACK_URLS[SupportedChainId.FUJI]],
  [SupportedChainId.OPTIMISM]: [`https://api.avax-test.network/ext/bc/C/rpc`, ...FALLBACK_URLS[SupportedChainId.FUJI]],
}
