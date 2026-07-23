import { TradingApi } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { EarnVaultFlow, EarnVaultTab } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnDepositSourceOption, EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type { EarnAnalyticsEntryPoint, EarnAnalyticsSurface } from 'uniswap/src/features/telemetry/types'

export type EarnVaultModalVaultData = {
  balanceLookupErrored: boolean
  balanceLookupHasData: boolean
  balanceLookupSettled: boolean
  onRetryBalanceLookup: () => void
  /** True when the position query failed; shows the balance error card in the vault overview. */
  balanceError: boolean
  onRetryBalance: () => void
  /** Lifetime earnings and its localized error (shown on the balance tab's rewards row). */
  lifetimeEarningsUsd: number | undefined
  lifetimeEarningsError: boolean
  /** True when the position has confirmed raw assets/shares that can be withdrawn. */
  canWithdraw: boolean
  /** User-facing token info for this vault. Wrapped-native vaults use native currency here. */
  currencyInfo: Maybe<CurrencyInfo>
  depositSourceOptions: EarnDepositSourceOption[]
  hasPosition: boolean
  isConnected: boolean
  /** True while we don't yet know if the user has a position — render a loader, not the no-position fork. */
  isPositionLoading: boolean
  position: EarnPositionInfo | undefined
  selectedDepositSource: EarnDepositSourceOption | undefined
  setSelectedDepositSourceCurrencyId: (currencyId: string) => void
  symbol: string
  unsupportedDepositSourceOptions: EarnDepositSourceOption[]
  vault: EarnVaultInfo | null
}

export type EarnVaultModalFlowHandlers = {
  onBackToDepositAmount: () => void
  onBackToVault: () => void
  onBackToWithdrawAmount: () => void
  onBuyWithCash: () => void
  onClose: () => void
  onDeposit: () => void
  onReviewDeposit: (params: {
    amount: string
    sourceChainId: UniverseChainId
    sourceCurrencyId: string
    isMax?: boolean
    tokenAmount?: string
  }) => void
  onSwapForToken: () => void
  onWithdraw: () => void
  onReviewWithdraw: (params: {
    amount: string
    chainId: UniverseChainId
    withdrawMode: TradingApi.EarnWithdrawMode
  }) => void
}

export type EarnVaultModalTabState = {
  selectedTab: EarnVaultTab
  setSelectedTab: (tab: EarnVaultTab) => void
}

export type EarnVaultModalContentProps = {
  analyticsEntryPoint: EarnAnalyticsEntryPoint
  analyticsSurface: EarnAnalyticsSurface
  onConnectWallet: () => void
  flow: EarnVaultFlow
  flowHandlers: EarnVaultModalFlowHandlers
  originatingTransactionId?: string
  projectedMonthlyEarningsUsd?: number
  sourceUpsellCurrencyId?: string
  swapAmountUsd?: number
  tabState: EarnVaultModalTabState
  vaultData: EarnVaultModalVaultData
}
