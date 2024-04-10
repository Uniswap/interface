import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { sendAnalyticsEvent } from 'analytics'
import ms from 'ms'
import { logSwapQuoteRequest } from 'tracing/swapFlowLoggers'
import { trace } from 'tracing/trace'

import { GetQuickQuoteArgs, PreviewTradeResult, QuickRouteResponse, QuoteState, RouterPreference } from './types'
import { isExactInput, transformQuickRouteToTrade } from './utils'

const UNISWAP_API_URL = process.env.REACT_APP_UNISWAP_API_URL
const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_API_URL === undefined || UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_API_URL and UNISWAP_GATEWAY_DNS_URL must be a defined environment variable`)
}

export const quickRouteApi = createApi({
  reducerPath: 'quickRouteApi',
  baseQuery: fetchBaseQuery(),
  endpoints: (build) => ({
    getQuickRoute: build.query<PreviewTradeResult, GetQuickQuoteArgs>({
      queryFn(args, _api, _extraOptions, fetch) {
        return trace({ name: 'QuickRoute', op: 'quote.quick_route' }, async (trace) => {
          logSwapQuoteRequest(args.tokenInChainId, RouterPreference.API, true)
          const {
            tokenInAddress,
            tokenInChainId,
            tokenOutAddress,
            tokenOutChainId,
            amount,
            tradeType,
            gatewayDNSUpdateAllEnabled,
          } = args
          const type = isExactInput(tradeType) ? 'EXACT_IN' : 'EXACT_OUT'

          const requestBody = {
            tokenInChainId,
            tokenInAddress,
            tokenOutChainId,
            tokenOutAddress,
            amount,
            tradeType: type,
          }

          const baseURL = gatewayDNSUpdateAllEnabled ? UNISWAP_GATEWAY_DNS_URL : UNISWAP_API_URL
          const response = await fetch({
            method: 'GET',
            url: `${baseURL}/quickroute`,
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
              trace.setStatus('not_found')
              sendAnalyticsEvent('No quote received from quickroute API', {
                requestBody,
                response,
              })
              return {
                data: { state: QuoteState.NOT_FOUND, latencyMs: trace.now() },
              }
            } else {
              trace.setError(response.error)
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
