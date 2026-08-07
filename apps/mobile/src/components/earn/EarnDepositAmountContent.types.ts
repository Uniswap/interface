import type { TradingApi } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnAction, EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'

export type EarnDepositAmountContentProps = {
  vault: EarnVaultInfo
  position?: EarnPositionInfo
  initialAction?: EarnAction
  initialChainId?: UniverseChainId
  initialAmount?: string
  initialSourceCurrencyId?: string
  initialWithdrawMode?: TradingApi.EarnWithdrawMode
  minimumBalanceDataUpdatedAtMs?: number
  onActionChange?: (action: EarnAction) => boolean
  onReview: (params: {
    action: EarnAction
    amount: string
    tokenAmount?: string
    chainId: UniverseChainId
    destinationCurrencyId?: string
    sourceCurrencyId?: string
    withdrawMode?: TradingApi.EarnWithdrawMode
  }) => void
  onOpenVaultDetails: () => void
  onOpenNetworkSelector: (chainId: UniverseChainId) => void
  onOpenDepositSourceSelector: () => void
}
