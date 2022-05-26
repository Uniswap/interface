import { SupportedChainId } from './chains'

const QUICK_NODE_MAINNET_KEY = process.env.REACT_APP_QUICK_NODE_MAINNET_KEY
const QUICK_NODE_OPTIMISM_KEY = process.env.REACT_APP_QUICK_NODE_OPTIMISM_KEY
const QUICK_NODE_ARBITRUM_KEY = process.env.REACT_APP_QUICK_NODE_ARBITRUM_KEY
const QUICK_NODE_POLYGON_KEY = process.env.REACT_APP_QUICK_NODE_POLYGON_KEY

if (!QUICK_NODE_MAINNET_KEY || !QUICK_NODE_OPTIMISM_KEY || !QUICK_NODE_ARBITRUM_KEY || !QUICK_NODE_POLYGON_KEY) {
  throw new Error('Missing a QuickNode Key')
}

/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
export const QUICK_NODE_NETWORK_URLS = {
  [SupportedChainId.MAINNET]: `https://dark-small-brook.quiknode.pro/${QUICK_NODE_MAINNET_KEY}`,
  [SupportedChainId.OPTIMISM]: `https:///quiet-weathered-river.optimism.quiknode.pro/${QUICK_NODE_OPTIMISM_KEY}`,
  [SupportedChainId.ARBITRUM_ONE]: `restless-purple-feather.arbitrum-mainnet.quiknode.pro/${QUICK_NODE_ARBITRUM_KEY}`,
  [SupportedChainId.POLYGON]: `https://dark-small-brook.quiknode.pro/${QUICK_NODE_POLYGON_KEY}`,
}
