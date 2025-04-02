import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'

import type { TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import type { WrapType } from 'uniswap/src/features/transactions/types/wrap'

const getIsInvalidSwap = ({ wrapType, trade }: { wrapType: WrapType; trade: TradeWithStatus }): boolean => {
  return !isWrapAction(wrapType) && !trade.trade
}

const useIsReviewButtonDisabled = (): boolean => {
  const {
    derivedSwapInfo: { wrapType, trade },
    isSubmitting,
  } = useSwapFormContext()
  const activeAccount = useAccountMeta()
  const { blockingWarning } = useParsedSwapWarnings()
  const { isBlocked: isBlockedAccount, isBlockedLoading: isBlockedAccountLoading } = useIsBlocked(
    activeAccount?.address,
  )
  const { walletNeedsRestore } = useTransactionModalContext()

  const isInvalidSwap = getIsInvalidSwap({ wrapType, trade })

  return (
    isInvalidSwap ||
    !!blockingWarning ||
    isBlockedAccount ||
    isBlockedAccountLoading ||
    walletNeedsRestore ||
    isSubmitting
  )
}

// TODO(WEB-5090): Simplify logic, deduplicate disabled vs isReviewButtonDisabled
export const useIsSwapButtonDisabled = (): boolean => {
  const isReviewButtonDisabled = useIsReviewButtonDisabled()
  const { swapRedirectCallback } = useTransactionModalContext()
  const activeAccount = useAccountMeta()

  const isViewOnlyWallet = activeAccount?.type === AccountType.Readonly

  return !!activeAccount && isReviewButtonDisabled && !isViewOnlyWallet && !swapRedirectCallback
}
