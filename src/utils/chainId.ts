import { ChainId } from 'src/constants/chains'

const supportedChains = Object.values(ChainId).map((c) => c.toString())

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChain(chainId: number | string) {
  if (!supportedChains.includes(chainId.toString())) {
    // Too noisy as lists include Polygon tokens.
    // TODO uncomment when polygon is supported
    // logger.debug('chainId', 'toSupportedChain', 'Unsupported chain:', chainId)
    return null
  }
  return parseInt(chainId.toString(), 10) as ChainId
}
