import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'

// Route param fields must be optional — the generic ReactNavigationModal wrapper can't
// narrow ModalName correctly when any entry has a required field.
export type EarnDepositReviewModalProps = {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  vault?: EarnVaultInfo
  position?: EarnPositionInfo
  amount?: string
  tokenAmount?: string
  originatingTransactionId?: string
  projectedMonthlyEarningsUsd?: number
  sourceChainId?: UniverseChainId
  sourceCurrencyId?: string
  sourceUpsellCurrencyId?: string
  startedAnalyticsKey?: string
  swapAmountUsd?: number
}
