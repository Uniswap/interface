import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { ChainId, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { sendAnalyticsEvent } from 'analytics'
import ms from 'ms'
import { trace } from 'tracing/trace'

import { FastQuoteResponse, QuoteState, RouterPreference, TradeResult } from './types'
import { transformFastRoutesToTrade } from './utils'

export type FastQuoteArgs = {
  account?: string
  tokenInAddress?: string
  tokenOutAddress?: string
  amount?: CurrencyAmount<Currency>
}

function getQuoteLatencyMeasure(mark: PerformanceMark): PerformanceMeasure {
  performance.mark('fast-quote-fetch-end')
  return performance.measure('fast-quote-fetch-latency', mark.name, 'fast-quote-fetch-end')
}

export const fastRoutingApi = createApi({
  reducerPath: 'fastRoutingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://nzr92qohxb.execute-api.us-east-1.amazonaws.com/prod',
  }),
  endpoints: (build) => ({
    getFastQuote: build.query<TradeResult, FastQuoteArgs>({
      async onQueryStarted(args: FastQuoteArgs, { queryFulfilled }) {
        trace(
          'quote',
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
        const quoteStartMark = performance.mark(`quote-fetch-start-${Date.now()}`)
        try {
          const { tokenInAddress, tokenOutAddress, amount } = args

          const params = {
            tokenInAddress,
            tokenOutAddress,
            tokenInChainId: ChainId.MAINNET,
            tokenOutChainId: ChainId.MAINNET,
            amount: amount?.toExact(),
          }

          const response = await fetch({
            method: 'GET',
            url: '/foobar',
            params,
          })

          if (amount === undefined || tokenInAddress === undefined || tokenOutAddress === undefined) {
            return {
              data: { state: QuoteState.NOT_FOUND, latencyMs: getQuoteLatencyMeasure(quoteStartMark).duration },
            }
          }

          if (response.error) {
            try {
              // cast as any here because we do a runtime check on it being an object before indexing into .errorCode
              const errorData = response.error.data as any
              // NO_ROUTE should be treated as a valid response to prevent retries.
              if (
                typeof errorData === 'object' &&
                (errorData?.errorCode === 'NO_ROUTE' || errorData?.detail === 'No quotes available')
              ) {
                sendAnalyticsEvent('No quote received from routing API', {
                  params,
                  response,
                  routerPreference: RouterPreference.API,
                })
                return {
                  data: { state: QuoteState.NOT_FOUND, latencyMs: getQuoteLatencyMeasure(quoteStartMark).duration },
                }
              }
            } catch {
              throw response.error
            }
          }

          const uraQuoteResponse = response.data as FastQuoteResponse
          const tradeResult = await transformFastRoutesToTrade(amount, uraQuoteResponse, args.account)
          return { data: { ...tradeResult, latencyMs: getQuoteLatencyMeasure(quoteStartMark).duration } }
        } catch (error: any) {
          console.warn(
            `GetQuote failed on Fast API, falling back to regular API: ${error?.message ?? error?.detail ?? error}`
          )
          return {
            data: { state: QuoteState.NOT_FOUND, latencyMs: getQuoteLatencyMeasure(quoteStartMark).duration },
          }
        }
      },
      keepUnusedDataFor: ms(`10s`),
      extraOptions: {
        maxRetries: 0,
      },
    }),
  }),
})

export const { useGetFastQuoteQuery } = fastRoutingApi
export const useGetFastQuoteQueryState = fastRoutingApi.endpoints.getFastQuote.useQueryState
