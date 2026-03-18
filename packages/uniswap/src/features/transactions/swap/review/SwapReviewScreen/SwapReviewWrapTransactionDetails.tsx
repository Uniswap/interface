import { memo } from 'react'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { logger } from 'utilities/src/logger/logger'

export const SwapReviewWrapTransactionDetails = memo(function SwapReviewWrapTransactionDetails(): JSX.Element | null {
  const { chainId, gasFee, reviewScreenWarning, txSimulationErrors, routing } = useSwapReviewTransactionStore((s) => ({
    chainId: s.chainId,
    gasFee: s.gasFee,
    reviewScreenWarning: s.reviewScreenWarning,
    txSimulationErrors: s.txSimulationErrors,
    routing: s.trade?.routing,
  }))

  const onShowWarning = useSwapReviewCallbacksStore((s) => s.onShowWarning)

  if (!chainId) {
    logger.error('Missing chainId in `SwapReviewWrapTransactionDetails`', {
      tags: {
        file: 'SwapReviewWrapTransactionDetails',
        function: 'render',
      },
    })

    return null
  }

  return (
    <TransactionDetails
      chainId={chainId}
      gasFee={gasFee}
      warning={reviewScreenWarning?.warning}
      txSimulationErrors={txSimulationErrors}
      routingType={routing}
      onShowWarning={onShowWarning}
    />
  )
})
