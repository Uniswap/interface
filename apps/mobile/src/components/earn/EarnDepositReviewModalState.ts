import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'

// Route param fields must be optional — the generic ReactNavigationModal wrapper can't
// narrow ModalName correctly when any entry has a required field.
export type EarnDepositReviewModalProps = {
  vault?: EarnVaultInfo
  position?: EarnPositionInfo
  amount?: string
  sourceChainId?: UniverseChainId
  sourceCurrencyId?: string
}
