import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import qs from 'qs'

import { GetQuoteInchResult, GetSwapInchResult } from './types'

export const routingApiInch = createApi({
  reducerPath: 'routingApiInch',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.1inch.io/v4.0' }),
  endpoints: (build) => ({
    getSwapInch: build.query<
      GetSwapInchResult,
      {
        chainId: string
        queryArg: {
          fromTokenAddress: string
          toTokenAddress: string
          amount: string
          fromAddress: string
          slippage: string
          destReceiver: string
          referrerAddress: string | null
          fee: string | null
          disableEstimate: boolean
        }
      }
    >({
      query: (args) => {
        const { chainId, queryArg } = args
        return `/${chainId}/swap?${qs.stringify(queryArg, { skipNulls: true })}`
      },
      extraOptions: { maxRetries: 1 }, // You can o
    }),
    getQuoteInch: build.query<
      GetQuoteInchResult,
      {
        chainId: string
        queryArg: {
          fromTokenAddress: string
          toTokenAddress: string
          amount: string
          protocols: string | null
        }
      }
    >({
      query: (args) => {
        const { chainId, queryArg } = args
        return `/${chainId}/quote?${qs.stringify(queryArg, { skipNulls: true })}`
      },
      extraOptions: { maxRetries: 3 }, // You can o
    }),
  }),
})

export const { useGetQuoteInchQuery } = routingApiInch
export const { useGetSwapInchQuery } = routingApiInch
