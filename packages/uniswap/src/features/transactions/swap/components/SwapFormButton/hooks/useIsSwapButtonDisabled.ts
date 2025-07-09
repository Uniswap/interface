import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useInterfaceWrap } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useInterfaceWrap'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'

const useIsReviewButtonDisabled = (): boolean => {
  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const isTradeMissing = useSwapFormStoreDerivedSwapInfo((s) => !s.trade.trade)

  const activeAccount = useAccountMeta()
  const { blockingWarning } = useParsedSwapWarnings()
  const { isBlocked: isBlockedAccount, isBlockedLoading: isBlockedAccountLoading } = useIsBlocked(
    activeAccount?.address,
  )
  const { walletNeedsRestore } = useTransactionModalContext()

  const { isInterfaceWrap, onInterfaceWrap } = useInterfaceWrap()
  const isWrapDisabled = isInterfaceWrap && !onInterfaceWrap

  return (
    !!blockingWarning ||
    isBlockedAccount ||
    isBlockedAccountLoading ||
    walletNeedsRestore ||
    isSubmitting ||
    isTradeMissing ||
    isWrapDisabled
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
