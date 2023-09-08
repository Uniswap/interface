import { NATIVE_NAMES_BY_ID } from '@kinetix/smart-order-router'
import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { ZERO_ADDRESS } from 'constants/misc'
import ms from 'ms'
import { trace } from 'tracing/trace'

import { OpenOceanQuoteResponse, QuoteMethod, QuoteState } from './types'
import { GetQuoteArgs, TradeResult } from './types'
import { transformRoutesToTrade } from './utils'

const OPENOCEAN_API_URL = process.env.REACT_APP_OPENOCEAN_API_URL
if (OPENOCEAN_API_URL === undefined) {
  throw new Error(`OPENOCEAN_API_URL must be a defined environment variable`)
}

// TODO KFI openocean get quotes api
export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: OPENOCEAN_API_URL,
  }),
  endpoints: (build) => ({
    getQuote: build.query<TradeResult, GetQuoteArgs>({
      async onQueryStarted(args: GetQuoteArgs, { queryFulfilled }) {
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
      // @ts-ignore
      async queryFn(args, _api, _extraOptions, fetch) {
        try {
          const isIntokenNative = NATIVE_NAMES_BY_ID[args.tokenInChainId]?.includes(args.tokenInAddress)
          const tokenInAddress = isIntokenNative ? ZERO_ADDRESS : args.tokenInAddress

          const tokenOutAddress = NATIVE_NAMES_BY_ID[args.tokenOutChainId]?.includes(args.tokenOutAddress)
            ? ZERO_ADDRESS
            : args.tokenOutAddress

          const params = {
            chain: 'kava',
            inTokenAddress: tokenInAddress,
            outTokenAddress: tokenOutAddress,
            amount: args.amount,
            gasPrice: 5,
            slippage: 1,
          }

          const response = await fetch({
            method: 'GET',
            url: '/quote',
            params,
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
                return {
                  data: { state: QuoteState.NOT_FOUND, latencyMs: 0 },
                }
              }
            } catch {
              throw response.error
            }
          }

          const quoteResponse = response.data as OpenOceanQuoteResponse
          console.log(quoteResponse)
          const tradeResult = await transformRoutesToTrade(args, quoteResponse, QuoteMethod.ROUTING_API)
          return { data: { ...tradeResult, latencyMs: 0 } }
        } catch (error: any) {
          console.error(
            `GetQuote failed on Unified Routing API, falling back to client: ${
              error?.message ?? error?.detail ?? error
            }`
          )
          return {
            error: { status: 'CUSTOM_ERROR', error: error?.detail ?? error?.message ?? error },
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

export const { useGetQuoteQuery } = routingApi
export const useGetQuoteQueryState = routingApi.endpoints.getQuote.useQueryState
