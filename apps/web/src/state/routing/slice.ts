import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import ms from 'ms'
import { logSwapQuoteRequest } from 'tracing/swapFlowLoggers'
import { trace } from 'tracing/trace'

import { GetQuoteArgs, QuoteMethod, QuoteState, TradeResult } from './types'
import { transformQuoteToTrade } from './utils'

const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

const CLIENT_PARAMS = {
  protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery(),
  endpoints: (build) => ({
    getQuote: build.query<TradeResult, GetQuoteArgs>({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      queryFn(args, _api, _extraOptions, fetch) {
        return trace({ name: 'Quote', op: 'quote', data: { ...args } }, async (trace) => {
          logSwapQuoteRequest(args.tokenInChainId, args.routerPreference, false)
          // const {
          //   tokenInAddress: tokenIn,
          //   tokenInChainId,
          //   tokenOutAddress: tokenOut,
          //   tokenOutChainId,
          //   amount,
          //   tradeType,
          //   sendPortionEnabled,
          // } = args

          // const requestBody = {
          //   tokenInChainId,
          //   tokenIn,
          //   tokenOutChainId,
          //   tokenOut,
          //   amount,
          //   sendPortionEnabled,
          //   type: isExactInput(tradeType) ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
          //   intent:
          //     args.routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ? QuoteIntent.Pricing : QuoteIntent.Quote,
          //   configs: getRoutingAPIConfig(args),
          // }

          // try {
          //   return trace.child({ name: 'Quote on server', op: 'quote.server' }, async () => {
          //     const response = await fetch({
          //       method: 'POST',
          //       url: `${UNISWAP_GATEWAY_DNS_URL}/quote`,
          //       body: JSON.stringify(requestBody),
          //       headers: {
          //         'x-request-source': 'uniswap-web',
          //       },
          //     })
          //
          //     if (response.error) {
          //       try {
          //         // cast as any here because we do a runtime check on it being an object before indexing into .errorCode
          //         const errorData = response.error.data as { errorCode?: string; detail?: string }
          //         // NO_ROUTE should be treated as a valid response to prevent retries.
          //         if (
          //           typeof errorData === 'object' &&
          //           (errorData?.errorCode === 'NO_ROUTE' || errorData?.detail === 'No quotes available')
          //         ) {
          //           sendAnalyticsEvent('No quote received from routing API', {
          //             requestBody,
          //             response,
          //             routerPreference: args.routerPreference,
          //           })
          //           return {
          //             data: { state: QuoteState.NOT_FOUND, latencyMs: trace.now() },
          //           }
          //         }
          //       } catch {
          //         throw response.error
          //       }
          //     }
          //
          //     const uraQuoteResponse = response.data as URAQuoteResponse
          //     const tradeResult = await transformQuoteToTrade(args, uraQuoteResponse, QuoteMethod.ROUTING_API)
          //     return { data: { ...tradeResult, latencyMs: trace.now() } }
          //   })
          // } catch (error: any) {
          //   console.warn(
          //     `GetQuote failed on Unified Routing API, falling back to client: ${
          //       error?.message ?? error?.detail ?? error
          //     }`
          //   )
          // }

          try {
            return trace.child({ name: 'Quote on client', op: 'quote.client' }, async () => {
              const { getRouter, getClientSideQuote } = await import('lib/hooks/routing/clientSideSmartOrderRouter')
              const router = getRouter(args.tokenInChainId)
              console.log('rrrrrrrrrrrrrrrrr', router)
              console.log('args', args)
              console.log('CLIENT_PARAMS', CLIENT_PARAMS)
              const quoteResult = await getClientSideQuote(args, router, CLIENT_PARAMS)
              if (quoteResult.state === QuoteState.SUCCESS) {
                const trade = await transformQuoteToTrade(args, quoteResult.data, QuoteMethod.CLIENT_SIDE_FALLBACK)
                return {
                  data: { ...trade, latencyMs: trace.now() },
                }
              } else {
                return { data: { ...quoteResult, latencyMs: trace.now() } }
              }
            })
          } catch (error: any) {
            console.warn(`GetQuote failed on client: ${error}`)
            trace.setError(error)
            return {
              error: { status: 'CUSTOM_ERROR', error: error?.detail ?? error?.message ?? error },
            }
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

export const { useGetQuoteQuery } = routingApi
export const useGetQuoteQueryState = routingApi.endpoints.getQuote.useQueryState
