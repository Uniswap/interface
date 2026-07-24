import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export interface EarnVaultCurator {
  name: string
  imageUrl?: string
}

// Per-asset exposure breakdown for a vault, derived from EarnVault.exposures.
export interface EarnVaultExposure {
  currencyId: string
  /** USD value of the vault's exposure to this asset. Undefined when the backend could not price it. */
  valueUsd?: number
  /** Share of the vault's total assets (0-1). May sum to less than 1 (idle assets aren't attributed). */
  share?: number
}

// Frontend-ready vault info derived from the data-api EarnVault protobuf.
// Keep backend-only fields on the generated type and add display/cache fields here in getEarnVaultInfo.
export interface EarnVaultInfo {
  id: string
  /** Actual vault underlying token. For wrapped-native vaults, this stays WETH/Wrapped native. */
  currencyId: string
  /** User-facing vault token. For wrapped-native vaults, this is the native currency. */
  displayCurrencyId: string
  /** ERC-4626 vault contract address. */
  vaultAddress: string
  /** Chain on which the vault is deployed. */
  chainId: UniverseChainId
  apyPercent: number
  exposureCurrencyIds: readonly string[]
  /** Per-asset exposure breakdown with USD values and shares. Empty until the backend populates it. */
  exposures: readonly EarnVaultExposure[]
  totalDepositsUsd: number
  /** Raw underlying amount that can currently be withdrawn from the vault. */
  liquidityRaw?: string
  liquidityUsd: number
  curator: EarnVaultCurator
  deploymentDate?: Date
  morphoUrl?: string
  exposureAndRiskUrl?: string
}

export interface EarnPositionInfo {
  vaultId: string
  depositedUsd: number
  /** Raw underlying token balance currently represented by the user's vault shares. */
  depositedRaw: string
  apyPercent: number
  /** Raw ERC-4626 vault share balance. */
  sharesRaw: string
  /** Populated by GetEarnPosition only; undefined from ListEarnPositions. */
  lifetimePnlUsd?: number
}

export type EarnVaultTab = 'balance' | 'details'

export enum EarnAction {
  Deposit = 'deposit',
  Withdraw = 'withdraw',
}

export type EarnDepositSourceOption = {
  id: string
  chainId: UniverseChainId
  currencyInfo: CurrencyInfo
  balanceQuantity: number
  /**
   * Exact raw wallet balance when the portfolio API provides one. Prefer this for Max/exact deposits
   * because `balanceQuantity` is a rounded JS number and can be slightly above the true balance.
   */
  balanceRaw?: string
  /** Undefined when the portfolio query could not price the balance. */
  balanceUsd: number | undefined
}

export type EarnDepositSourceOptionsBySupport = {
  supportedDepositSourceOptions: EarnDepositSourceOption[]
  unsupportedDepositSourceOptions: EarnDepositSourceOption[]
}
