import type { PropsWithChildren } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { FLASHBLOCKS_UI_SKIP_ROUTES } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import { useClearFlashblocksSwapNotifications } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useClearFlashblocksSwapNotifications'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useAcceptedTrade } from 'uniswap/src/features/transactions/swap/review/hooks/useAcceptedTrade'
import type { SwapReviewTransactionState } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/createSwapReviewTransactionStore'
import { createSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/createSwapReviewTransactionStore'
import { SwapReviewTransactionStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/SwapReviewTransactionStoreContext'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { getRelevantTokenWarningSeverity } from 'uniswap/src/features/transactions/TransactionDetails/utils/getRelevantTokenWarningSeverity'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'

export const SwapReviewTransactionStoreContextProvider = ({
  children,
  derivedSwapInfo,
  swapTxContext,
}: PropsWithChildren<Pick<SwapReviewTransactionState, 'derivedSwapInfo' | 'swapTxContext'>>): JSX.Element => {
  const { dangerouslyGetLatestDerivedSwapInfo, isSubmitting } = useSwapFormStore((s) => ({
    dangerouslyGetLatestDerivedSwapInfo: s.dangerouslyGetLatestDerivedSwapInfo,
    isSubmitting: s.isSubmitting,
  }))

  const { onAcceptTrade, acceptedDerivedSwapInfo, newTradeRequiresAcceptance } = useAcceptedTrade({
    derivedSwapInfo: dangerouslyGetLatestDerivedSwapInfo,
    isSubmitting,
  })

  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(acceptedDerivedSwapInfo?.chainId)
  useClearFlashblocksSwapNotifications(
    isFlashblocksEnabled &&
      !(
        acceptedDerivedSwapInfo?.trade.trade?.routing &&
        FLASHBLOCKS_UI_SKIP_ROUTES.includes(acceptedDerivedSwapInfo.trade.trade.routing)
      ),
  )

  const uniswapXGasBreakdown = isUniswapX(swapTxContext) ? swapTxContext.gasFeeBreakdown : undefined

  const {
    chainId,
    currencies,
    wrapType,
    trade: { trade, indicativeTrade }, // TODO(WEB-5823): rm indicative trade usage from review screen
  } = derivedSwapInfo

  const { blockingWarning, reviewScreenWarning } = useParsedSwapWarnings()
  const isWrap = isWrapAction(wrapType)
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade
  const feeOnTransferProps = useFeeOnTransferAmounts(acceptedDerivedSwapInfo)
  const tokenWarningProps = getRelevantTokenWarningSeverity(acceptedDerivedSwapInfo)

  const txSimulationErrors = useMemo(() => {
    if (!trade || !isClassic(trade)) {
      return undefined
    }
    return trade.quote.quote.txFailureReasons
  }, [trade])

  const derivedUpdatedState: SwapReviewTransactionState = useMemo(
    () => ({
      trade: trade ?? undefined,
      indicativeTrade: indicativeTrade ?? undefined,
      acceptedTrade: acceptedTrade ?? undefined,
      swapTxContext,
      gasFee: swapTxContext.gasFee,
      uniswapXGasBreakdown,
      derivedSwapInfo,
      acceptedDerivedSwapInfo,
      isWrap,
      blockingWarning,
      reviewScreenWarning,
      txSimulationErrors,
      newTradeRequiresAcceptance,
      feeOnTransferProps,
      tokenWarningProps,
      currencyInInfo: currencies[CurrencyField.INPUT],
      currencyOutInfo: currencies[CurrencyField.OUTPUT],
      chainId,
      onAcceptTrade,
    }),
    [
      trade,
      indicativeTrade,
      acceptedTrade,
      swapTxContext,
      uniswapXGasBreakdown,
      derivedSwapInfo,
      acceptedDerivedSwapInfo,
      isWrap,
      blockingWarning,
      reviewScreenWarning,
      txSimulationErrors,
      newTradeRequiresAcceptance,
      feeOnTransferProps,
      tokenWarningProps,
      currencies,
      chainId,
      onAcceptTrade,
    ],
  )

  const [store] = useState(() => createSwapReviewTransactionStore(derivedUpdatedState))

  const hasDerivedStateChanged = useHasValueChanged(derivedUpdatedState)

  useEffect(() => {
    if (hasDerivedStateChanged) {
      store.setState(derivedUpdatedState)
    }
  }, [derivedUpdatedState, store, hasDerivedStateChanged])

  return (
    <SwapReviewTransactionStoreContext.Provider value={store}>{children}</SwapReviewTransactionStoreContext.Provider>
  )
}
