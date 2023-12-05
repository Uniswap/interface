import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { sendAnalyticsEvent } from 'analytics'
import ms from 'ms'
import { logSwapQuoteRequest } from 'tracing/swapFlowLoggers'
import { trace } from 'tracing/trace'

import { GetQuickQuoteArgs, PreviewTradeResult, QuickRouteResponse, QuoteState, RouterPreference } from './types'
import { isExactInput, transformQuickRouteToTrade } from './utils'

const UNISWAP_API_URL = process.env.REACT_APP_UNISWAP_API_URL
if (UNISWAP_API_URL === undefined) {
  throw new Error(`UNISWAP_API_URL must be a defined environment variable`)
}

function getQuoteLatencyMeasure(mark: PerformanceMark): PerformanceMeasure {
  performance.mark('quickroute-fetch-end')
  return performance.measure('quickroute-fetch-latency', mark.name, 'quickroute-fetch-end')
}

export const quickRouteApi = createApi({
  reducerPath: 'quickRouteApi',
  baseQuery: fetchBaseQuery({
    baseUrl: UNISWAP_API_URL,
  }),
  endpoints: (build) => ({
    getQuickRoute: build.query<PreviewTradeResult, GetQuickQuoteArgs>({
      async onQueryStarted(args: GetQuickQuoteArgs, { queryFulfilled }) {
        trace(
          'quickroute',
          async ({ setTraceError, setTraceStatus }) => {
            try {
              await queryFulfilled
            } catch (error: unknown) {
              if (error && typeof error === 'object' && 'error' in error) {
                const queryError = (error as Record<'error', FetchBaseQueryError>).error
                if (typeof queryError.status === 'number') {
                  setTraceStatus(queryError.status)
                }
                setTraceError(queryError)
              } else {
                throw error
              }
            }
          },
          {
            data: {
              ...args,
            },
          }
        )
      },
      async queryFn(args, _api, _extraOptions, fetch) {
        logSwapQuoteRequest(args.tokenInChainId, RouterPreference.API, true)
        const quoteStartMark = performance.mark(`quickroute-fetch-start-${Date.now()}`)
        const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, tradeType } = args
        const type = isExactInput(tradeType) ? 'EXACT_IN' : 'EXACT_OUT'

        const requestBody = {
          tokenInChainId,
          tokenInAddress,
          tokenOutChainId,
          tokenOutAddress,
          amount,
          tradeType: type,
        }

        const response = await fetch({
          method: 'GET',
          url: '/quickroute',
          params: requestBody,
        })

        if (response.error) {
          // cast as any here because we do a runtime check on it being an object before indexing into .errorCode
          const errorData = response.error.data as { errorCode?: string; detail?: string }
          // NO_ROUTE should be treated as a valid response to prevent retries.
          if (
            typeof errorData === 'object' &&
            (errorData?.errorCode === 'NO_ROUTE' || errorData?.detail === 'No quotes available')
          ) {
            sendAnalyticsEvent('No quote received from quickroute API', {
              requestBody,
              response,
            })
            return {
              data: { state: QuoteState.NOT_FOUND, latencyMs: getQuoteLatencyMeasure(quoteStartMark).duration },
            }
          } else {
            return { error: response.error }
          }
        }

        const quickRouteResponse = response.data as QuickRouteResponse
        const previewTrade = transformQuickRouteToTrade(args, quickRouteResponse)
        return {
          data: {
            state: QuoteState.SUCCESS,
            trade: previewTrade,
            latencyMs: getQuoteLatencyMeasure(quoteStartMark).duration,
          },
        }
      },
      keepUnusedDataFor: ms(`10s`),
      extraOptions: {
        maxRetries: 0,
      },
    }),
  }),
})

export const { useGetQuickRouteQuery } = quickRouteApi
export const useGetQuickRouteQueryState = quickRouteApi.endpoints.getQuickRoute.useQueryState
