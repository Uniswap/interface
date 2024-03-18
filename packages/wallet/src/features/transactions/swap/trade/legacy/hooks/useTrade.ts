import { NetworkStatus } from '@apollo/client'
import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useRouterQuote } from 'wallet/src/features/transactions/swap/trade/legacy/hooks/useRouterQuote'
import { SWAP_FORM_DEBOUNCE_TIME_MS } from 'wallet/src/features/transactions/swap/trade/tradingApi/hooks/useTradingApiTrade'
import { validateTrade } from 'wallet/src/features/transactions/swap/trade/tradingApi/utils'
import { TradeWithStatus, UseTradeArgs } from 'wallet/src/features/transactions/swap/trade/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

export function useTrade(args: UseTradeArgs): TradeWithStatus {
  const {
    amountSpecified,
    otherCurrency,
    tradeType,
    pollInterval,
    customSlippageTolerance,
    isUSDQuote,
    sendPortionEnabled,
    skip,
  } = args
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(
    amountSpecified,
    SWAP_FORM_DEBOUNCE_TIME_MS
  )

  const formatter = useLocalizationContext()

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
    pollInterval,
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

    const exactCurrencyField =
      tradeType === TradeType.EXACT_INPUT ? CurrencyField.INPUT : CurrencyField.OUTPUT

    const trade = validateTrade({
      trade: data.trade,
      currencyIn,
      currencyOut,
      exactAmount: amount,
      exactCurrencyField,
      formatter,
    })

    return {
      loading: (amountSpecified && isDebouncing) || loading,
      isFetching: networkStatus === NetworkStatus.poll,
      error,
      trade,
    }
  }, [
    data?.trade,
    tradeType,
    amount,
    otherCurrency,
    formatter,
    amountSpecified,
    isDebouncing,
    loading,
    networkStatus,
    error,
  ])
}
