import { useEffect } from 'react'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'

export function useResetEarnFlowOnQuoteError(): void {
  const isEarnFlow = useSwapFormStore((s) => s.isEarnFlow === true)
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const { acceptedTrade, isFetching, isLoading, trade, tradeError } = useSwapReviewTransactionStore((s) => ({
    acceptedTrade: s.acceptedTrade,
    isFetching: s.derivedSwapInfo.trade.isFetching,
    isLoading: s.derivedSwapInfo.trade.isLoading,
    trade: s.trade,
    tradeError: s.derivedSwapInfo.trade.error,
  }))

  useEffect(() => {
    if (!isEarnFlow || trade || !tradeError || isLoading || isFetching) {
      return
    }

    const acceptedTradeIsEarn = Boolean(acceptedTrade && isChained(acceptedTrade) && acceptedTrade.earnIntent)
    if (!acceptedTradeIsEarn) {
      updateSwapForm({ isEarnFlow: false })
    }
  }, [acceptedTrade, isEarnFlow, isFetching, isLoading, trade, tradeError, updateSwapForm])
}
