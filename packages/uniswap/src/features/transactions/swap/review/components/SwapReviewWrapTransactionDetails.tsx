import { memo } from 'react'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { useSwapReviewCallbacks } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewCallbacksContext'
import { useSwapReviewTransactionState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewTransactionContext'

export const SwapReviewWrapTransactionDetails = memo(function SwapReviewWrapTransactionDetails(): JSX.Element | null {
  const { chainId, gasFee, reviewScreenWarning, txSimulationErrors } = useSwapReviewTransactionState()
  const { onShowWarning } = useSwapReviewCallbacks()
  return (
    <TransactionDetails
      chainId={chainId}
      gasFee={gasFee}
      warning={reviewScreenWarning?.warning}
      txSimulationErrors={txSimulationErrors}
      onShowWarning={onShowWarning}
    />
  )
})
