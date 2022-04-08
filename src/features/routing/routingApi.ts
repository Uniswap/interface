import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ChainId } from 'src/constants/chains'
import { DEFAULT_DEADLINE_S, DEFAULT_SLIPPAGE_TOLERANCE } from 'src/constants/misc'
import { QuoteResult } from 'src/features/routing/types'
import { serializeQueryParams } from 'src/features/swap/utils'

const ROUTING_API_BASE_URL = 'https://api.uniswap.org/v1'

const protocols: string[] = ['v2', 'v3']

const DEFAULT_QUERY_PARAMS = {
  protocols: protocols.map((p) => p.toLowerCase()).join(','),
  // example other params
  // forceCrossProtocol: 'true',
  // minSplits: '5',
}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: ROUTING_API_BASE_URL,
    prepareHeaders: (headers) => {
      // TODO remove once routing api officially supports mobile
      // spoof origin to go around server permissions
      headers.set('Origin', 'https://app.uniswap.org')
      return headers
    },
  }),
  endpoints: (build) => ({
    quote: build.query<
      QuoteResult,
      {
        amount: string
        deadline?: number
        recipient?: string
        slippageTolerance?: number
        tokenInAddress: string
        tokenInChainId: ChainId
        tokenOutAddress: string
        tokenOutChainId: ChainId
        type: 'exactIn' | 'exactOut'
      }
    >({
      query: ({
        amount,
        deadline = DEFAULT_DEADLINE_S,
        recipient,
        slippageTolerance = DEFAULT_SLIPPAGE_TOLERANCE,
        tokenInAddress,
        tokenInChainId,
        tokenOutAddress,
        tokenOutChainId,
        type,
      }) =>
        `quote?${serializeQueryParams({
          ...DEFAULT_QUERY_PARAMS,
          amount,
          tokenInAddress,
          tokenInChainId,
          tokenOutAddress,
          tokenOutChainId,
          type,
          ...(recipient
            ? {
                recipient,
                slippageTolerance,
                deadline,
              }
            : {}),
        })}`,
    }),
  }),
})

export const { useQuoteQuery } = routingApi
