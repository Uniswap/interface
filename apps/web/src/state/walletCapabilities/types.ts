import type { GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'

export interface WalletCapabilitiesState {
  getCapabilitiesStatus: GetCapabilitiesStatus
  byChain: GetCapabilitiesResult
}

export enum GetCapabilitiesStatus {
  Unknown = 'Unknown',
  Supported = 'Supported',
  Unsupported = 'Unsupported',
}
