import { UseQueryResult } from '@tanstack/react-query'
import { useRef } from 'react'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import { QuoteWithTradeAndGasEstimate } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiQuoteQuery'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { GetQuoteRequestResult } from 'uniswap/src/features/transactions/swap/hooks/useTrade/createGetQuoteRequestArgs'
import { determineSwapCurrenciesAndStaticArgs } from 'uniswap/src/features/transactions/swap/hooks/useTrade/determineSwapCurrenciesAndStaticArgs'
import { useGetTradingApiQuoteQueryOptions } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useGetTradingApiQuoteQueryOptions'
import { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useTradeQuery(
  params: UseTradeArgs & { quoteRequestArgs?: GetQuoteRequestResult },
): UseQueryResult<QuoteWithTradeAndGasEstimate> {
  /***** Format request arguments ******/
  const derivedParamData = determineSwapCurrenciesAndStaticArgs(params)

  /***** Fetch quote from trading API  ******/
  const pollingIntervalForChain = usePollingIntervalByChain(derivedParamData.currencyIn?.chainId)
  const internalPollInterval = params.pollInterval ?? pollingIntervalForChain

  const getTradingApiQuoteQueryOptions = useGetTradingApiQuoteQueryOptions({
    amountSpecified: params.amountSpecified,
    isUSDQuote: params.isUSDQuote ?? false,
    derivedParamData,
  })

  const response = useQueryWithImmediateGarbageCollection({
    ...getTradingApiQuoteQueryOptions(params.quoteRequestArgs),
    refetchInterval: internalPollInterval,
    // We set the `gcTime` to 15 seconds longer than the refetch interval so that there's more than enough time for a refetch to complete before we clear the stale data.
    // If the user loses internet connection (or leaves the app and comes back) for longer than this,
    // then we clear stale data and show a big loading spinner in the swap review screen.
    immediateGcTime: internalPollInterval + ONE_SECOND_MS * 15,
    // We want to retry once, rather than the default, in order to populate response.error / Error UI sooner.
    // The query will still poll after failed retries, due to staleness.
    retry: 1,
  })

  const errorRef = useRef<Error | null>(response.error)

  // We want to keep the error while react-query is refetching, so that the error message doesn't go in and out while it's polling.
  if (response.errorUpdatedAt > response.dataUpdatedAt) {
    // If there's a new error, save the new one. If there's no error (we're re-fetching), keep the old one.
    errorRef.current = response.error ?? errorRef.current
  } else {
    errorRef.current = response.error
  }

  return {
    ...response,
    error: errorRef.current,
  } as UseQueryResult<QuoteWithTradeAndGasEstimate>
}
