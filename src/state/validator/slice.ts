import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
  retry,
} from '@reduxjs/toolkit/query/react'
import qs from 'qs'

import { GetValidatorGaslessQuoteResult, GetValidatorQuoteResult } from './types'

export const routingApiKromatika = createApi({
  reducerPath: 'routingApiKromatika',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3146/1.0' }),
  endpoints: (build) => ({
    getQuote: build.query<
      GetValidatorGaslessQuoteResult,
      {
        chainId: string
        queryArg: {
          sellToken: string
          buyToken: string
          sellAmount: string | null
          buyAmount: string | null
          recipient: string | null | undefined
          slippage: string
          affiliate: string | null
          affiliateFee: string | null
          skipValidation: boolean
          signaturePermitData: string | null | undefined
        }
      }
    >({
      query: (args) => {
        const { chainId, queryArg } = args
        return `/137/getMockData`
      },
      extraOptions: { maxRetries: 3 }, // You can o
    }),
    getGaslessQuote: build.query<
      GetValidatorGaslessQuoteResult,
      {
        chainId: string
        queryArg: {
          sellToken: string
          buyToken: string
          sellAmount: string | null
          buyAmount: string | null
          recipient: string | null | undefined
          slippage: string
          affiliate: string | null
          affiliateFee: string | null
          skipValidation: boolean
          signaturePermitData: string | null | undefined
        }
      }
    >({
      query: (args) => {
        const { chainId, queryArg } = args
        return `/${chainId}/getMockData`
      },
      extraOptions: { maxRetries: 3 }, // You can o
    }),
  }),
})

export const { useGetQuoteQuery } = routingApiKromatika
export const { useGetGaslessQuoteQuery } = routingApiKromatika
