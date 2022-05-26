import { SupportedChainId } from './chains'

const ALCHEMY_MAINNET_KEY = process.env.REACT_APP_ALCHEMY_MAINNET_KEY
const ALCHEMY_OPTIMISM_KEY = process.env.REACT_APP_ALCHEMY_OPTIMISM_KEY
const ALCHEMY_ARBITRUM_KEY = process.env.REACT_APP_ALCHEMY_ARBITRUM_KEY
const ALCHEMY_POLYGON_KEY = process.env.REACT_APP_ALCHEMY_ARBITRUM_KEY

if (!ALCHEMY_MAINNET_KEY || !ALCHEMY_OPTIMISM_KEY || !ALCHEMY_ARBITRUM_KEY || !ALCHEMY_POLYGON_KEY) {
  throw new Error('Missing an Alchemy Key')
}

/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
export const ALCHEMY_NETWORK_URLS = {
  [SupportedChainId.MAINNET]: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_MAINNET_KEY}`,
  [SupportedChainId.OPTIMISM]: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_OPTIMISM_KEY}`,
  [SupportedChainId.ARBITRUM_ONE]: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ARBITRUM_KEY}`,
  [SupportedChainId.POLYGON]: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_POLYGON_KEY}`,
}
