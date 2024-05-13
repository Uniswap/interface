import { ChainId } from '@ubeswap/sdk-core'
import { SupportedInterfaceChain } from 'constants/chains'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
}
const QUICKNODE_MAINNET_RPC_URL = process.env.REACT_APP_QUICKNODE_MAINNET_RPC_URL
if (typeof QUICKNODE_MAINNET_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_QUICKNODE_MAINNET_RPC_URL must be a defined environment variable`)
}
const QUICKNODE_ARBITRUM_RPC_URL = process.env.REACT_APP_QUICKNODE_ARBITRUM_RPC_URL
if (typeof QUICKNODE_ARBITRUM_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_QUICKNODE_ARBITRUM_RPC_URL must be a defined environment variable`)
}
const QUICKNODE_BNB_RPC_URL = process.env.REACT_APP_BNB_RPC_URL
if (typeof QUICKNODE_BNB_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_BNB_RPC_URL must be a defined environment variable`)
}

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
  [ChainId.MAINNET]: [
    // "Safe" URLs
    'https://api.mycryptoapi.com/eth',
    'https://cloudflare-eth.com',
    // "Fallback" URLs
    'https://rpc.ankr.com/eth',
    'https://eth-mainnet.public.blastapi.io',
  ],
  [ChainId.CELO]: [
    // "Safe" URLs
    `https://forno.celo.org`,
  ],
  [ChainId.CELO_ALFAJORES]: [
    // "Safe" URLs
    `https://alfajores-forno.celo-testnet.org`,
  ],
}

/**
 * Application-specific JSON-RPC endpoints.
 * These are URLs which may only be used by the interface, due to origin policies, &c.
 */
export const APP_RPC_URLS: Record<SupportedInterfaceChain, string[]> = {
  [ChainId.MAINNET]: [`https://mainnet.infura.io/v3/${INFURA_KEY}`, QUICKNODE_MAINNET_RPC_URL],
  [ChainId.CELO]: [`https://celo-mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.CELO_ALFAJORES]: [`https://celo-alfajores.infura.io/v3/${INFURA_KEY}`],
}

export const INFURA_PREFIX_TO_CHAIN_ID: { [prefix: string]: ChainId } = {
  mainnet: ChainId.MAINNET,
  goerli: ChainId.GOERLI,
  sepolia: ChainId.SEPOLIA,
  'optimism-mainnet': ChainId.OPTIMISM,
  'optimism-goerli': ChainId.OPTIMISM_GOERLI,
  'arbitrum-mainnet': ChainId.ARBITRUM_ONE,
  'arbitrum-goerli': ChainId.ARBITRUM_GOERLI,
  'polygon-mainnet': ChainId.POLYGON,
  'polygon-mumbai': ChainId.POLYGON_MUMBAI,
  'avalanche-mainnet': ChainId.AVALANCHE,
  'base-mainnet': ChainId.BASE,
}
