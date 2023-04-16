import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import qs from 'qs'

import { GetValidatorGaslessQuoteResult, GetValidatorQuoteResult } from './types'

export const routingApiKromatika = createApi({
  reducerPath: 'routingApiKromatika',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:4000/v1.0' }),
  endpoints: (build) => ({
    getQuote: build.query<
      GetValidatorQuoteResult,
      {
        chainId: string
        queryArg: {
          fromAddress: string
          sellTokenAddress: string
          buyTokenAddress: string
          sellTokenAmount: string | null
          buyTokenAmount: string | null
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
        return `/${chainId}/getQuote?${qs.stringify(queryArg, { skipNulls: true })}`
      },
      extraOptions: { maxRetries: 3 }, // You can o
    }),
    getGaslessQuote: build.query<
      GetValidatorGaslessQuoteResult,
      {
        chainId: string
        queryArg: {
          fromAddress: string
          sellTokenAddress: string
          buyTokenAddress: string
          sellTokenAmount: string | null
          buyTokenAmount: string | null
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
        return `/${chainId}/getGaslessQuote?${qs.stringify(queryArg, { skipNulls: true })}`
      },
      extraOptions: { maxRetries: 3 }, // You can o
    }),
  }),
})

export const { useGetQuoteQuery } = routingApiKromatika
export const { useGetGaslessQuoteQuery } = routingApiKromatika
