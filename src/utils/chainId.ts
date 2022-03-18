import { ChainId } from 'src/constants/chains'
import { logger } from 'src/utils/logger'

const supportedChains = Object.values(ChainId).map((c) => c.toString())

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId: number | string) {
  if (!supportedChains.includes(chainId.toString())) {
    // Too noisy as lists include Polygon tokens.
    logger.debug('chainId', 'toSupportedChainId', 'Unsupported chain:', chainId)
    return null
  }
  return parseInt(chainId.toString(), 10) as ChainId
}

// variant on `toSupportedChain` with a narrower return type
export function parseActiveChains(activeChainsString: string): ChainId[] {
  return activeChainsString.split(',').map((id) => parseInt(id, 10) as ChainId)
}

export function isTestnet(_chainId: ChainId): boolean {
  // prevents network request to covalent
  return true
}
