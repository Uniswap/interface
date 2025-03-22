import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTradingApiIndicativeQuoteQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiIndicativeQuoteQuery'
import { IndicativeQuoteRequest, QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__/index'
import { IndicativeTrade, validateIndicativeQuoteResponse } from 'uniswap/src/features/transactions/swap/types/trade'
import { logger } from 'utilities/src/logger/logger'

interface UseIndicativeTradeParams {
  quoteRequestArgs?: QuoteRequest
  currencyIn?: Currency | null
  currencyOut?: Currency | null
  skip?: boolean
}

export function useIndicativeTrade({ quoteRequestArgs, currencyIn, currencyOut, skip }: UseIndicativeTradeParams): {
  trade: IndicativeTrade | undefined
  isLoading: boolean
} {
  // Avoid passing unused fields to Indicative endpoint; IndicativeQuote request uses less fields than Quote request.
  const params: IndicativeQuoteRequest | undefined = useMemo(() => {
    if (!quoteRequestArgs?.type) {
      return undefined
    }
    return {
      type: quoteRequestArgs.type,
      amount: quoteRequestArgs.amount,
      tokenInChainId: quoteRequestArgs.tokenInChainId,
      tokenOutChainId: quoteRequestArgs.tokenOutChainId,
      tokenIn: quoteRequestArgs.tokenIn,
      tokenOut: quoteRequestArgs.tokenOut,
    }
  }, [
    quoteRequestArgs?.amount,
    quoteRequestArgs?.tokenInChainId,
    quoteRequestArgs?.tokenOutChainId,
    quoteRequestArgs?.tokenIn,
    quoteRequestArgs?.tokenOut,
    quoteRequestArgs?.type,
  ])

  const { data, isLoading } = useTradingApiIndicativeQuoteQuery({
    params: currencyIn && currencyOut && !skip ? params : undefined,
  })

  return useMemo(() => {
    const validatedResponse = data ? validateIndicativeQuoteResponse(data) : undefined
    if (!validatedResponse || !currencyIn || !currencyOut) {
      return { trade: undefined, isLoading }
    }

    try {
      const trade = new IndicativeTrade({ quote: validatedResponse, currencyIn, currencyOut })
      return { trade, isLoading }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'useIndicativeTrade.ts', function: 'useIndicativeTrade' },
      })
      return { trade: undefined, isLoading: false }
    }
  }, [currencyIn, currencyOut, data, isLoading])
}
