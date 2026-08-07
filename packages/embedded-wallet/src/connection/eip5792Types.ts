/**
 * Structural mirrors of the EIP-5792 shapes in `wallet/src/features/dappRequests/types`.
 * This package must not depend on `wallet` (wallet depends on this package), so the
 * shapes are duplicated here; compatibility is checked structurally where web composes
 * the two (see apps/web embeddedWalletProviderInstance).
 */

export type EmbeddedWalletCapability = Record<string, unknown>

export interface EmbeddedWalletCallsStatusReceipt {
  logs?: { address: string; data: string; topics: string[] }[]
  status: string
  blockHash?: string
  blockNumber?: string
  gasUsed?: string
  transactionHash: string
}

export interface EmbeddedWalletCallsStatus {
  version: string
  id: string
  chainId: string
  status: number
  atomic?: boolean
  receipts?: EmbeddedWalletCallsStatusReceipt[]
  capabilities?: { caip345?: { caip2: string; transactionHashes: string[] } } & Record<string, unknown>
}

/**
 * Chain-level capability derivation, injected by the app (web wires `wallet`'s
 * `getCapabilitiesCore` here so this package never imports `wallet`).
 */
export type GetCapabilitiesCore = (args: {
  address: string
  chainIds: number[]
  hasSmartWalletConsent: boolean
}) => Promise<Record<string, EmbeddedWalletCapability>>
