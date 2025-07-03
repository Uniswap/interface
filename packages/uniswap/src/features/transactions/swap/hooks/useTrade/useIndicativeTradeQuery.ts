import { useMemo } from 'react'
import { useIndicativeTrade } from 'uniswap/src/features/transactions/swap/hooks/useIndicativeTrade'
import { type GetQuoteRequestResult } from 'uniswap/src/features/transactions/swap/hooks/useTrade/createGetQuoteRequestArgs'
import { determineSwapCurrenciesAndStaticArgs } from 'uniswap/src/features/transactions/swap/hooks/useTrade/determineSwapCurrenciesAndStaticArgs'
import { type UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'

export function useIndicativeTradeQuery(
  params: UseTradeArgs & { quoteRequestArgs?: GetQuoteRequestResult },
): ReturnType<typeof useIndicativeTrade> {
  const { currencyIn, currencyOut } = determineSwapCurrenciesAndStaticArgs(params)
  const { isUSDQuote } = params

  const indicativeParams = useMemo(() => {
    return {
      quoteRequestArgs: params.quoteRequestArgs,
      currencyIn,
      currencyOut,
      skip: isUSDQuote,
    }
  }, [isUSDQuote, currencyIn, currencyOut, params.quoteRequestArgs])

  return useIndicativeTrade(indicativeParams)
}
