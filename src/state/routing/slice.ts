import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'
import { SupportedChainId } from 'constants/chains'
import { GetQuoteResult } from './types'

export const routingApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.uniswap.org/v1/',
  }),
  endpoints: (build) => ({
    getQuote: build.query<
      GetQuoteResult,
      {
        blockNumber: number // invalidates query on block change
        tokenIn: { address: string; chainId: SupportedChainId }
        tokenOut: { address: string; chainId: SupportedChainId }
        amount: string
        type: 'exactIn' | 'exactOut'
        recipient: string
        slippageTolerance?: string
        deadline?: string
      }
    >({
      query: (args) => ({
        url: `quote`,
        method: 'POST',
        body: args,
      }),
    }),
  }),
})

export const { useGetQuoteQuery } = routingApi
