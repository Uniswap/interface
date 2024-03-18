import { ChainId } from '@uniswap/sdk-core'
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
  [ChainId.GOERLI]: [
    // "Safe" URLs
    'https://rpc.goerli.mudit.blog/',
    // "Fallback" URLs
    'https://rpc.ankr.com/eth_goerli',
  ],
  [ChainId.SEPOLIA]: [
    // "Safe" URLs
    'https://rpc.sepolia.dev/',
    // "Fallback" URLs
    'https://rpc.sepolia.org/',
    'https://rpc2.sepolia.org/',
    'https://rpc.sepolia.online/',
    'https://www.sepoliarpc.space/',
    'https://rpc-sepolia.rockx.com/',
    'https://rpc.bordel.wtf/sepolia',
  ],
  [ChainId.POLYGON]: [
    // "Safe" URLs
    'https://polygon-rpc.com/',
    'https://rpc-mainnet.matic.network',
    'https://matic-mainnet.chainstacklabs.com',
    'https://rpc-mainnet.maticvigil.com',
    'https://rpc-mainnet.matic.quiknode.pro',
    'https://matic-mainnet-full-rpc.bwarelabs.com',
  ],
  [ChainId.POLYGON_MUMBAI]: [
    // "Safe" URLs
    'https://matic-mumbai.chainstacklabs.com',
    'https://rpc-mumbai.maticvigil.com',
    'https://matic-testnet-archive-rpc.bwarelabs.com',
  ],
  [ChainId.ARBITRUM_ONE]: [
    // "Safe" URLs
    'https://arb1.arbitrum.io/rpc',
    // "Fallback" URLs
    'https://arbitrum.public-rpc.com',
  ],
  [ChainId.ARBITRUM_GOERLI]: [
    // "Safe" URLs
    'https://goerli-rollup.arbitrum.io/rpc',
  ],
  [ChainId.OPTIMISM]: [
    // "Safe" URLs
    'https://mainnet.optimism.io/',
    // "Fallback" URLs
    'https://rpc.ankr.com/optimism',
  ],
  [ChainId.OPTIMISM_GOERLI]: [
    // "Safe" URLs
    'https://goerli.optimism.io',
  ],
  [ChainId.CELO]: [
    // "Safe" URLs
    `https://forno.celo.org`,
  ],
  [ChainId.CELO_ALFAJORES]: [
    // "Safe" URLs
    `https://alfajores-forno.celo-testnet.org`,
  ],
  [ChainId.BNB]: [
    // "Safe" URLs
    'https://endpoints.omniatech.io/v1/bsc/mainnet/public',
    'https://bsc-mainnet.gateway.pokt.network/v1/lb/6136201a7bad1500343e248d',
    'https://1rpc.io/bnb',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed2.defibit.io',
    'https://bsc-dataseed1.ninicoin.io',
    'https://binance.nodereal.io',
    'https://bsc-dataseed4.defibit.io',
    'https://rpc.ankr.com/bsc',
  ],
  [ChainId.AVALANCHE]: [
    // "Safe" URLs
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain.publicnode.com',
  ],
  [ChainId.BASE]: [
    // "Safe" URLs
    'https://mainnet.base.org/',
    'https://developer-access-mainnet.base.org/',
    'https://base.gateway.tenderly.co',
    'https://base.publicnode.com',
    // "Fallback" URLs
    'https://1rpc.io/base',
    'https://base.meowrpc.com',
  ],
}

/**
 * Application-specific JSON-RPC endpoints.
 * These are URLs which may only be used by the interface, due to origin policies, &c.
 */
export const APP_RPC_URLS: Record<SupportedInterfaceChain, string[]> = {
  [ChainId.MAINNET]: [`https://mainnet.infura.io/v3/${INFURA_KEY}`, QUICKNODE_MAINNET_RPC_URL],
  [ChainId.GOERLI]: [`https://goerli.infura.io/v3/${INFURA_KEY}`],
  [ChainId.SEPOLIA]: [`https://sepolia.infura.io/v3/${INFURA_KEY}`],
  [ChainId.OPTIMISM]: [`https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.OPTIMISM_GOERLI]: [`https://optimism-goerli.infura.io/v3/${INFURA_KEY}`],
  [ChainId.ARBITRUM_ONE]: [`https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`, QUICKNODE_ARBITRUM_RPC_URL],
  [ChainId.ARBITRUM_GOERLI]: [`https://arbitrum-goerli.infura.io/v3/${INFURA_KEY}`],
  [ChainId.POLYGON]: [`https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.POLYGON_MUMBAI]: [`https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`],
  [ChainId.CELO]: [`https://celo-mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.CELO_ALFAJORES]: [`https://celo-alfajores.infura.io/v3/${INFURA_KEY}`],
  [ChainId.BNB]: [QUICKNODE_BNB_RPC_URL],
  [ChainId.AVALANCHE]: [`https://avalanche-mainnet.infura.io/v3/${INFURA_KEY}`],
  [ChainId.BASE]: [`https://base-mainnet.infura.io/v3/${INFURA_KEY}`],
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
