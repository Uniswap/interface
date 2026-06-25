import type { HexString } from '@universe/encoding'

export interface ChainCapabilities {
  [capabilityName: string]:
    | {
        [key: string]: unknown
      }
    | undefined
}
export interface GetCapabilitiesResult {
  [chainId: HexString]: ChainCapabilities
}
