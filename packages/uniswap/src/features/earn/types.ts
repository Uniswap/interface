import type { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface EarnVaultCurator {
  name: string
  address?: string
  tvlUsd?: number
}

// Frontend-ready vault info derived from the data-api EarnVault protobuf.
// Keep backend-only fields on the generated type and add display/cache fields here in getEarnVaultInfo.
export interface EarnVaultInfo {
  id: string
  currencyId: string
  /** ERC-4626 vault contract address. */
  vaultAddress: string
  /** Chain on which the vault is deployed. */
  chainId: UniverseChainId
  apyPercent: number
  exposureCurrencyIds: readonly string[]
  totalDepositsUsd: number
  liquidityUsd: number
  curator: EarnVaultCurator
  deploymentDate?: Date
  morphoUrl?: string
  exposureAndRiskUrl?: string
}

export interface EarnPositionInfo {
  vaultId: string
  depositedUsd: number
  apyPercent: number
  /** Raw vault shares balance. */
  sharesRaw: string
}
