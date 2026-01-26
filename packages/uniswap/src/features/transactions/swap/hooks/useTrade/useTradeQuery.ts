import { UseQueryResult } from '@tanstack/react-query'
import { useQueryWithImmediateGarbageCollection } from '@universe/api'
import { useRef } from 'react'
import { useTradeService } from 'uniswap/src/features/services'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { parseQuoteCurrencies } from 'uniswap/src/features/transactions/swap/hooks/useTrade/parseQuoteCurrencies'
import { createTradeServiceQueryOptions } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useTradeServiceQueryOptions'
import { TradeWithGasEstimates } from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useTradeQuery(params: UseTradeArgs): UseQueryResult<TradeWithGasEstimates> {
  const quoteCurrencyData = parseQuoteCurrencies({
    tradeType: params.tradeType,
    amountSpecified: params.amountSpecified,
    otherCurrency: params.otherCurrency,
    sellToken: params.sellToken,
    buyToken: params.buyToken,
  })
  
  // CRITICAL: If currencyIn or currencyOut is undefined, the query should be disabled
  // This prevents sending quote requests with missing or incorrect tokens
  const isQueryEnabled = !params.skip && !!quoteCurrencyData.currencyIn && !!quoteCurrencyData.currencyOut
  
  const pollingIntervalForChain = usePollingIntervalByChain(quoteCurrencyData.currencyIn?.chainId)
  const internalPollInterval = params.pollInterval ?? pollingIntervalForChain
  const tradeService = useTradeService()
  const getTradeQueryOptions = useEvent(createTradeServiceQueryOptions({ tradeService }))

  const baseQueryOptions = getTradeQueryOptions(params)
  const response = useQueryWithImmediateGarbageCollection({
    ...baseQueryOptions,
    // Override enabled flag to ensure query is disabled if currencies are missing
    enabled: isQueryEnabled && baseQueryOptions.enabled,
    refetchInterval: internalPollInterval,
    // Set staleTime to prevent duplicate requests within the polling interval
    // This ensures we don't refetch if data is still fresh, even if query key changes
    staleTime: internalPollInterval,
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
  } as UseQueryResult<TradeWithGasEstimates>
}
