import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { fetchQuote } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  createGetTradingApiQuoteQueryOptions,
  getTransformQuoteToTrade,
  type GetTradingApiQuoteQueryOptions,
} from 'uniswap/src/data/apiClients/tradingApi/useTradingApiQuoteQuery'
import { determineSwapCurrenciesAndStaticArgs } from 'uniswap/src/features/transactions/swap/hooks/useTrade/determineSwapCurrenciesAndStaticArgs'
import { createQuoteRepository } from 'uniswap/src/features/transactions/swap/services/tradeService/quoteRepository'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export function useGetTradingApiQuoteQueryOptions(params: {
  amountSpecified: Maybe<CurrencyAmount<Currency>>
  isUSDQuote: boolean
  derivedParamData: ReturnType<typeof determineSwapCurrenciesAndStaticArgs>
}): GetTradingApiQuoteQueryOptions {
  const getDerivedParamData = useEvent(() => params.derivedParamData)
  const getAmountSpecified = useEvent(() => params.amountSpecified)
  const getIsUSDQuote = useEvent(() => params.isUSDQuote)

  // move to context
  const quoteRepository = useMemo(() => {
    return createQuoteRepository({
      getIsUSDQuote,
      fetchQuote,
      logger,
    })
  }, [getIsUSDQuote])

  //needs to be stable
  const select = useEvent(
    getTransformQuoteToTrade({
      getDerivedParamData,
      getAmountSpecified,
    }),
  )

  return useEvent(
    createGetTradingApiQuoteQueryOptions({
      quoteRepository,
      select,
      logger,
    }),
  )
}
