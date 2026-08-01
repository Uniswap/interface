import type { TradingApi } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'

// Route param fields must be optional — the generic ReactNavigationModal wrapper can't
// narrow ModalName correctly when any entry has a required field.
export type EarnWithdrawReviewModalProps = {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  vault?: EarnVaultInfo
  position?: EarnPositionInfo
  amount?: string
  chainId?: UniverseChainId
  destinationCurrencyId?: string
  startedAnalyticsKey?: string
  withdrawMode?: TradingApi.EarnWithdrawMode
}
