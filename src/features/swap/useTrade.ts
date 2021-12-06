import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useQuote, UseQuoteProps } from 'src/features/prices/useQuote'
import { transformQuoteToTrade } from 'src/features/swap/routeUtils'

export function useTrade(quoteParams: UseQuoteProps) {
  const { amountSpecified, otherCurrency, tradeType } = quoteParams

  const { status, error, data } = useQuote(quoteParams)

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const currencyOut =
    tradeType === TradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  // TODO: also return status
  return useMemo(() => {
    if (!currencyIn || !currencyOut || !data) {
      return { status, error, trade: null }
    }

    return { status, error, trade: transformQuoteToTrade(currencyIn, currencyOut, tradeType, data) }
  }, [currencyIn, currencyOut, data, error, status, tradeType])
}
