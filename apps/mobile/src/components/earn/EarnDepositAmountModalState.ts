import type { TradingApi } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnAction, EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'

// Route param fields must be optional — the generic ReactNavigationModal wrapper can't
// narrow ModalName correctly when any entry has a required field.
export type EarnDepositAmountModalState = {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  vault?: EarnVaultInfo
  position?: EarnPositionInfo
  initialAction?: EarnAction
  initialChainId?: UniverseChainId
  initialAmount?: string
  initialSourceCurrencyId?: string
  initialWithdrawMode?: TradingApi.EarnWithdrawMode
  minimumBalanceDataUpdatedAtMs?: number
  startedAnalyticsKey?: string
  originatingTransactionId?: string
  projectedMonthlyEarningsUsd?: number
  sourceUpsellCurrencyId?: string
  swapAmountUsd?: number
}
