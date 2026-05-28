import type { HexString } from '@universe/encoding'

export interface ChainCapabilities {
  [capabilityName: string]:
    | {
        // atomic is the only capability we care about right now
        // it is: { status: 'supported' | 'ready' | 'unsupported' }
        [key: string]: unknown
      }
    | undefined
}
export interface GetCapabilitiesResult {
  [chainId: HexString]: ChainCapabilities
}
