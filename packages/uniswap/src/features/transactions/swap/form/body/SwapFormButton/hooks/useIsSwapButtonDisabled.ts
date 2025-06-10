import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'

const useIsReviewButtonDisabled = (): boolean => {
  const {
    derivedSwapInfo: { trade },
    isSubmitting,
  } = useSwapFormContext()
  const activeAccount = useAccountMeta()
  const { blockingWarning } = useParsedSwapWarnings()
  const { isBlocked: isBlockedAccount, isBlockedLoading: isBlockedAccountLoading } = useIsBlocked(
    activeAccount?.address,
  )
  const { walletNeedsRestore } = useTransactionModalContext()

  const tradeMissing = !trade

  return (
    tradeMissing ||
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
