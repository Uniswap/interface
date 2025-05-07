import type { HexString } from 'uniswap/src/utils/hex'

export interface ChainCapabilities {
  [capabilityName: string]: {
    // atomic is the only capability we care about right now
    // it is: { status: 'supported' | 'ready' | 'unsupported' }
    [key: string]: unknown
  }
}
export interface GetCapabilitiesResult {
  [chainId: HexString]: ChainCapabilities
}
