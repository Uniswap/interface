import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useEffect, useState } from 'react'
import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { resolveSponsorMetadata } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/resolveSponsorMetadata'
import { ReviewNetworkCostRowSlot } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/ReviewNetworkCostRowSlot'
import { getEVMTxRequest } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { logger } from 'utilities/src/logger/logger'

export const SwapReviewWrapTransactionDetails = memo(function SwapReviewWrapTransactionDetails(): JSX.Element | null {
  const { chainId, gasFee, reviewScreenWarning, txSimulationErrors, routing, swapTxContext } =
    useSwapReviewTransactionStore((s) => ({
      chainId: s.chainId,
      gasFee: s.gasFee,
      reviewScreenWarning: s.reviewScreenWarning,
      txSimulationErrors: s.txSimulationErrors,
      routing: s.trade?.routing,
      swapTxContext: s.swapTxContext,
    }))

  const onShowWarning = useSwapReviewCallbacksStore((s) => s.onShowWarning)

  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()

  const [stableIncludesDelegation, setStableIncludesDelegation] = useState<boolean | undefined>(
    swapTxContext.includesDelegation,
  )

  useEffect(() => {
    if (swapTxContext.includesDelegation !== undefined) {
      setStableIncludesDelegation(swapTxContext.includesDelegation)
    }
  }, [swapTxContext.includesDelegation])

  if (!chainId) {
    logger.error('Missing chainId in `SwapReviewWrapTransactionDetails`', {
      tags: {
        file: 'SwapReviewWrapTransactionDetails',
        function: 'render',
      },
    })

    return null
  }

  const txRequest = getEVMTxRequest(swapTxContext)
  const sponsorMetadata = resolveSponsorMetadata(swapTxContext)

  const NetworkCostRowSlot =
    !sponsorMetadata && isGasFeeOverridesEnabled && enableCustomGasFeeEntry ? (
      <ReviewNetworkCostRowSlot
        chainId={chainId}
        gasFee={gasFee}
        tx={txRequest}
        includesDelegation={stableIncludesDelegation}
      />
    ) : undefined

  return (
    <TransactionDetails
      chainId={chainId}
      gasFee={gasFee}
      warning={reviewScreenWarning?.warning}
      txSimulationErrors={txSimulationErrors}
      routingType={routing}
      includesDelegation={stableIncludesDelegation}
      NetworkCostRowSlot={NetworkCostRowSlot}
      sponsorMetadata={sponsorMetadata}
      onShowWarning={onShowWarning}
    />
  )
})
