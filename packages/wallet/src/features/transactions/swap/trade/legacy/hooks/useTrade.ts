import { NetworkStatus } from '@apollo/client'
import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import { useRouterQuote } from 'wallet/src/features/transactions/swap/trade/legacy/hooks/useRouterQuote'
import { TradeWithStatus, UseTradeArgs } from 'wallet/src/features/transactions/swap/trade/types'

import { clearStaleTrades } from 'wallet/src/features/transactions/swap/utils'

export function useTrade(args: UseTradeArgs): TradeWithStatus {
  const {
    amountSpecified,
    otherCurrency,
    tradeType,
    pollingInterval,
    customSlippageTolerance,
    isUSDQuote,
    sendPortionEnabled,
    skip,
  } = args
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)

  /*
    1. if user clears input (amountSpecified is null or undefined), immediately use that
    instead of the debounced value so that there's no lingering loading state on empty inputs

    2. if user changes networks, also immediately use that so there's no mismatch between
    chains for input/output currencies
  */
  const shouldDebounce =
    amountSpecified && debouncedAmountSpecified?.currency.chainId === otherCurrency?.chainId

  const amount = shouldDebounce ? debouncedAmountSpecified : amountSpecified

  const { loading, networkStatus, error, data } = useRouterQuote({
    amountSpecified: amount,
    otherCurrency,
    tradeType,
    pollingInterval,
    customSlippageTolerance,
    isUSDQuote,
    sendPortionEnabled,
    skip,
  })

  return useMemo(() => {
    if (!data?.trade) {
      return { loading, error, trade: null }
    }

    const [currencyIn, currencyOut] =
      tradeType === TradeType.EXACT_INPUT
        ? [amount?.currency, otherCurrency]
        : [otherCurrency, amount?.currency]

    const trade = clearStaleTrades(data.trade, currencyIn, currencyOut)

    return {
      loading: (amountSpecified && isDebouncing) || loading,
      isFetching: networkStatus === NetworkStatus.poll,
      error,
      trade,
    }
  }, [
    data?.trade,
    loading,
    error,
    tradeType,
    amount?.currency,
    otherCurrency,
    amountSpecified,
    isDebouncing,
    networkStatus,
  ])
}
