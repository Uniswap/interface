import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@thinkincoin/router-sdk'
import { TradeType } from '@thinkincoin-libs/sdk-core'
import { ChainId } from '@thinkincoin-libs/sdk-core'
import { getClientSideQuote } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import ms from 'ms.macro'
import { trace } from 'tracing/trace'

import { QuoteMethod, QuoteReponse, QuoteState, TradeResult } from './types'
import { getRouter, isExactInput, shouldUseAPIRouter, transformRoutesToTrade } from './utils'

export interface GetQuoteArgs {
  tokenInAddress: string
  tokenInChainId: ChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: ChainId
  tokenOutDecimals: number
  tokenOutSymbol?: string
  amount: string
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  tradeType: TradeType
  isRoutingAPIPrice?: boolean
}

export enum RouterPreference {
  AUTO = 'auto',
  API = 'api',
  CLIENT = 'client',
}

// This is excluded from `RouterPreference` enum because it's only used
// internally for token -> USDC trades to get a USD value.
export const INTERNAL_ROUTER_PREFERENCE_PRICE = 'price' as const

const CLIENT_PARAMS = {
  protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
}

// routing API quote query params: https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/schema/quote-schema.ts
const CLASSIC_SWAP_QUERY_PARAMS = {
  ...CLIENT_PARAMS,
  routingType: 'CLASSIC',
}

export const routingApiV2 = createApi({
  reducerPath: 'routingApiV2',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.uniswap.org/v2/',
  }),
  endpoints: (build) => ({
    getQuote: build.query<TradeResult, GetQuoteArgs>({
      async onQueryStarted(args: GetQuoteArgs, { queryFulfilled }) {
        trace(
          'quote-v2',
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
              isPrice: args.routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE,
              isAutoRouter:
                args.routerPreference === RouterPreference.AUTO || args.routerPreference === RouterPreference.API,
            },
          }
        )
      },
      async queryFn(args: GetQuoteArgs, _api, _extraOptions, fetch) {
        let fellBack = false
        if (shouldUseAPIRouter(args)) {
          fellBack = true
          try {
            const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, tradeType } = args
            const type = isExactInput(tradeType) ? 'EXACT_INPUT' : 'EXACT_OUTPUT'

            const requestBody = {
              tokenInChainId,
              tokenIn: tokenInAddress,
              tokenOutChainId,
              tokenOut: tokenOutAddress,
              amount,
              type,
              configs: [CLASSIC_SWAP_QUERY_PARAMS],
            }

            const response = await fetch({
              method: 'POST',
              url: '/quote',
              body: JSON.stringify(requestBody),
            })

            if (response.error) {
              try {
                // cast as any here because we do a runtime check on it being an object before indexing into .errorCode
                const errorData = response.error.data as any
                // NO_ROUTE should be treated as a valid response to prevent retries.
                if (
                  typeof errorData === 'object' &&
                  (errorData?.errorCode === 'NO_ROUTE' || errorData?.detail === 'No quotes available')
                ) {
                  return { data: { state: QuoteState.NOT_FOUND } }
                }
              } catch {
                throw response.error
              }
            }

            const quoteData = response.data as QuoteReponse
            const tradeResult = transformRoutesToTrade(args, quoteData.quote)

            return { data: { ...tradeResult, method: QuoteMethod.ROUTING_API } }
          } catch (error: any) {
            console.warn(
              `GetQuote failed on API v2, falling back to client: ${error?.message ?? error?.detail ?? error}`
            )
          }
        }
        try {
          const method = fellBack ? QuoteMethod.CLIENT_SIDE_FALLBACK : QuoteMethod.CLIENT_SIDE
          const router = getRouter(args.tokenInChainId)
          const quoteResult = await getClientSideQuote(args, router, CLIENT_PARAMS)
          if (quoteResult.state === QuoteState.SUCCESS) {
            return { data: { ...transformRoutesToTrade(args, quoteResult.data), method } }
          } else {
            return { data: quoteResult }
          }
        } catch (error: any) {
          console.warn(`GetQuote failed on client: ${error}`)
          return { error: { status: 'CUSTOM_ERROR', error: error?.detail ?? error?.message ?? error } }
        }
      },
      keepUnusedDataFor: ms`10s`,
    }),
  }),
})

export const { useGetQuoteQuery } = routingApiV2
