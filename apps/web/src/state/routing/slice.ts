import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@jaguarswap/router-sdk'
import { sendAnalyticsEvent } from 'analytics'
import { isUniswapXSupportedChain } from 'constants/chains'
import ms from 'ms'
import { logSwapQuoteRequest } from 'tracing/swapFlowLoggers'
import { trace } from 'tracing/trace'
import { getRouter, getClientSideQuote } from 'lib/hooks/routing/clientSideSmartOrderRouter'

import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, QuoteIntent, QuoteMethod, QuoteState, RouterPreference, RoutingConfig, TradeResult, URAQuoteResponse, URAQuoteType } from './types'
import { isExactInput, transformQuoteToTrade } from './utils'

const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

const CLIENT_PARAMS = {
  // protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
  protocols: [Protocol.V3],
  debugRouting: true
}

const protocols: Protocol[] = [Protocol.V2, Protocol.V3, Protocol.MIXED]

// routing API quote query params: https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/schema/quote-schema.ts
const DEFAULT_QUERY_PARAMS = {
  protocols,
  // this should be removed once BE fixes issue where enableUniversalRouter is required for fees to work
  enableUniversalRouter: true,
}

function getRoutingAPIConfig(args: GetQuoteArgs): RoutingConfig {
  const { account, tokenInChainId, uniswapXForceSyntheticQuotes, routerPreference } = args

  const uniswapx = {
    useSyntheticQuotes: uniswapXForceSyntheticQuotes,
    // Protocol supports swap+send to different destination address, but
    // for now recipient === swapper
    recipient: account,
    swapper: account,
    routingType: URAQuoteType.DUTCH_LIMIT,
  }

  const classic = {
    ...DEFAULT_QUERY_PARAMS,
    routingType: URAQuoteType.CLASSIC,
    recipient: account,
    enableFeeOnTransferFeeFetching: true,
  }

  if (
    // If the user has opted out of UniswapX during the opt-out transition period, we should respect that preference and only request classic quotes.
    routerPreference === RouterPreference.API ||
    routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ||
    !isUniswapXSupportedChain(tokenInChainId)
  ) {
    return [classic]
  }

  return [uniswapx, classic]
}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery(),
  endpoints: (build) => ({
    getQuote: build.query<TradeResult, GetQuoteArgs>({
      queryFn(args, _api, _extraOptions, fetch) {
        return trace({ name: 'Quote', op: 'quote', data: { ...args } }, async (trace) => {
          logSwapQuoteRequest(args.tokenInChainId, args.routerPreference, false)

          try {
            return trace.child({ name: 'Quote on client', op: 'quote.client' }, async (clientTrace) => {
              const router = getRouter(args.tokenInChainId)
              try {
                const quoteResult = await getClientSideQuote(args, router, CLIENT_PARAMS)
                if (quoteResult.state === QuoteState.SUCCESS) {
                  const trade = await transformQuoteToTrade(args, quoteResult.data, QuoteMethod.CLIENT_SIDE_FALLBACK)
                  return {
                    data: { ...trade, latencyMs: trace.now() },
                  }
                } else {
                  clientTrace.setStatus('not_found')
                  trace.setStatus('not_found')
                  return { data: { ...quoteResult, latencyMs: trace.now() } }
                }
              } catch (error) {
                console.log('🚀 ~ returntrace.child ~ error:', error)
              }
            })
          } catch (error: any) {
            console.warn(`GetQuote failed on client: ${error}`)
            trace.setError(error)
            return {
              error: {
                status: 'CUSTOM_ERROR',
                error: error?.detail ?? error?.message ?? error,
              },
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
