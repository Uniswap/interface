import { UseQueryResult } from '@tanstack/react-query'
import { is403Error, useQueryWithImmediateGarbageCollection } from '@universe/api'
import { useCallback, useRef } from 'react'
import { useTradeService } from 'uniswap/src/features/services'
import {
  usePollingIntervalByChain,
  useQuoteRefetchIntervalForChain,
} from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { parseQuoteCurrencies } from 'uniswap/src/features/transactions/swap/hooks/useTrade/parseQuoteCurrencies'
import { createTradeServiceQueryOptions } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useTradeServiceQueryOptions'
import { TradeWithGasEstimates } from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

// A 403 (region or permissioned-pool block) won't clear on the next poll, so a blocked open tab
// polls slowly instead of at block time. It still clears on input change or window refocus.
export const FORBIDDEN_QUOTE_POLL_INTERVAL_MS = ONE_MINUTE_MS

export function shouldRetryQuote(failureCount: number, error: Error): boolean {
  return failureCount < 1 && !is403Error(error)
}

export function getQuoteRefetchInterval({
  baseInterval,
  error,
}: {
  baseInterval: number | (() => number)
  error: Error | null
}): number {
  if (is403Error(error)) {
    return FORBIDDEN_QUOTE_POLL_INTERVAL_MS
  }
  return typeof baseInterval === 'function' ? baseInterval() : baseInterval
}

export function useTradeQuery(params: UseTradeArgs): UseQueryResult<TradeWithGasEstimates> {
  const quoteCurrencyData = parseQuoteCurrencies(params)
  const chainId = quoteCurrencyData.currencyIn?.chainId
  const chainDefaultPollIntervalMs = usePollingIntervalByChain(chainId)
  const refetchIntervalForChain = useQuoteRefetchIntervalForChain(chainId)
  // Caller-supplied `pollInterval` (e.g. USDC price quotes) bypasses chain
  // randomization on both lines. `refetchIntervalForChain` may be a number or
  // a function (when randomized); `maxRefetchIntervalMs` mirrors it as a plain
  // number so we can size `immediateGcTime` from the upper-bound interval.
  const baseRefetchInterval = params.pollInterval ?? refetchIntervalForChain
  const refetchInterval = useCallback(
    (query: { state: { error: Error | null } }): number =>
      getQuoteRefetchInterval({ baseInterval: baseRefetchInterval, error: query.state.error }),
    [baseRefetchInterval],
  )
  const maxRefetchIntervalMs = params.pollInterval ?? chainDefaultPollIntervalMs
  const tradeService = useTradeService()
  const getTradeQueryOptions = useEvent(createTradeServiceQueryOptions({ tradeService }))

  const response = useQueryWithImmediateGarbageCollection({
    ...getTradeQueryOptions(params),
    refetchInterval,
    // We set the `gcTime` to 15 seconds longer than the maximum refetch interval so that there's more than enough time for a refetch to complete before we clear the stale data.
    // If the user loses internet connection (or leaves the app and comes back) for longer than this,
    // then we clear stale data and show a big loading spinner in the swap review screen.
    immediateGcTime: maxRefetchIntervalMs + ONE_SECOND_MS * 15,
    // We want to retry once (never on a 403), rather than the default, in order to populate response.error / Error UI sooner.
    // The query will still poll after failed retries, due to staleness.
    retry: shouldRetryQuote,
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
