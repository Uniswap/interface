import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import ms from 'ms'
import { GetQuickQuoteArgs, PreviewTradeResult, QuickRouteResponse, QuoteState } from 'state/routing/types'
import { isExactInput, transformQuickRouteToTrade } from 'state/routing/utils'
import { trace } from 'tracing/trace'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'

const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_GATEWAY_DNS_URL must be a defined environment variable`)
}

export const quickRouteApi = createApi({
  reducerPath: 'quickRouteApi',
  baseQuery: fetchBaseQuery(),
  endpoints: (build) => ({
    getQuickRoute: build.query<PreviewTradeResult, GetQuickQuoteArgs>({
      queryFn(args, _api, _extraOptions, fetch) {
        return trace({ name: 'QuickRoute', op: 'quote.quick_route' }, async (trace) => {
          logSwapQuoteFetch({ chainId: args.tokenInChainId, isQuickRoute: true })
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
            url: `${UNISWAP_GATEWAY_DNS_URL}/quickroute`,
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
              sendAnalyticsEvent(InterfaceEventNameLocal.NoQuoteReceivedFromQuickrouteAPI, {
                requestBody,
                response,
              })
              return {
                data: { state: QuoteState.NOT_FOUND, latencyMs: trace.now() },
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
              latencyMs: trace.now(),
            },
          }
        })
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
